<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['error' => 'method not allowed']);
}

$payload = readPayload();
$name = trim((string)($payload['name'] ?? ''));
$contact = trim((string)($payload['contact'] ?? ''));
$message = trim((string)($payload['message'] ?? ''));

if ($name === '' || $contact === '' || $message === '') {
    respond(400, ['error' => 'Заполните все поля.']);
}

$config = loadEnv(__DIR__ . '/.env');
$required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USERNAME', 'SMTP_PASSWORD', 'MAIL_FROM', 'MAIL_TO'];

foreach ($required as $key) {
    if (empty($config[$key])) {
        respond(500, ['error' => 'Не настроена отправка заявки.']);
    }
}

$subject = 'Новая заявка Showcase';
$body = implode("\n", [
    'Имя: ' . $name,
    'Контакт: ' . $contact,
    '',
    'Описание задачи:',
    $message,
]);

try {
    sendSmtpMail($config, $subject, $body);
    respond(200, ['message' => 'Заявка отправлена. Я свяжусь с Вами.']);
} catch (Throwable $error) {
    error_log('Showcase contact form mail error: ' . $error->getMessage());
    respond(500, ['error' => 'Не удалось отправить заявку. Попробуйте позже.']);
}

function readPayload(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '', true);

    if (is_array($data)) {
        return $data;
    }

    return $_POST;
}

function loadEnv(string $path): array
{
    if (!is_file($path)) {
        return [];
    }

    $values = [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines ?: [] as $line) {
        $line = trim($line);

        if ($line === '' || strpos($line, '#') === 0) {
            continue;
        }

        [$key, $value] = array_pad(explode('=', $line, 2), 2, '');
        $key = trim($key);
        $value = trim($value, " \t\n\r\0\x0B\"'");

        if ($key !== '') {
            $values[$key] = $value;
        }
    }

    return $values;
}

function sendSmtpMail(array $config, string $subject, string $body): void
{
    $host = $config['SMTP_HOST'];
    $port = (int)$config['SMTP_PORT'];
    $username = $config['SMTP_USERNAME'];
    $password = $config['SMTP_PASSWORD'];
    $from = $config['MAIL_FROM'];
    $to = $config['MAIL_TO'];
    $address = ($port === 465 ? 'ssl://' : '') . $host . ':' . $port;

    $socket = stream_socket_client($address, $errno, $errstr, 20, STREAM_CLIENT_CONNECT);

    if (!$socket) {
        throw new RuntimeException('SMTP connection failed: ' . $errstr . ' (' . $errno . ')');
    }

    stream_set_timeout($socket, 20);

    try {
        smtpExpect($socket, [220]);
        smtpCommand($socket, 'EHLO showcase.local', [250]);

        if ($port !== 465) {
            smtpCommand($socket, 'STARTTLS', [220]);

            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('STARTTLS failed');
            }

            smtpCommand($socket, 'EHLO showcase.local', [250]);
        }

        smtpCommand($socket, 'AUTH LOGIN', [334]);
        smtpCommand($socket, base64_encode($username), [334]);
        smtpCommand($socket, base64_encode($password), [235]);
        smtpCommand($socket, 'MAIL FROM:<' . sanitizeAddress($from) . '>', [250]);
        smtpCommand($socket, 'RCPT TO:<' . sanitizeAddress($to) . '>', [250, 251]);
        smtpCommand($socket, 'DATA', [354]);

        fwrite($socket, buildMessage($from, $to, $subject, $body) . "\r\n.\r\n");
        smtpExpect($socket, [250]);
        smtpCommand($socket, 'QUIT', [221]);
    } finally {
        fclose($socket);
    }
}

function buildMessage(string $from, string $to, string $subject, string $body): string
{
    $headers = [
        'From: ' . sanitizeHeader($from),
        'To: ' . sanitizeHeader($to),
        'Subject: ' . encodeHeader($subject),
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
    ];

    return implode("\r\n", $headers) . "\r\n\r\n" . dotStuff($body);
}

function smtpCommand($socket, string $command, array $expectedCodes): string
{
    fwrite($socket, $command . "\r\n");
    return smtpExpect($socket, $expectedCodes);
}

function smtpExpect($socket, array $expectedCodes): string
{
    $response = '';

    while (($line = fgets($socket, 515)) !== false) {
        $response .= $line;

        if (strlen($line) >= 4 && $line[3] === ' ') {
            break;
        }
    }

    $code = (int)substr($response, 0, 3);

    if (!in_array($code, $expectedCodes, true)) {
        throw new RuntimeException('Unexpected SMTP response: ' . trim($response));
    }

    return $response;
}

function sanitizeAddress(string $value): string
{
    return str_replace(["\r", "\n", '<', '>'], '', $value);
}

function sanitizeHeader(string $value): string
{
    return str_replace(["\r", "\n"], '', $value);
}

function encodeHeader(string $value): string
{
    return '=?UTF-8?B?' . base64_encode($value) . '?=';
}

function dotStuff(string $body): string
{
    $body = str_replace(["\r\n", "\r"], "\n", $body);
    $lines = explode("\n", $body);

    foreach ($lines as &$line) {
        if (strpos($line, '.') === 0) {
            $line = '.' . $line;
        }
    }

    return implode("\r\n", $lines);
}

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}
