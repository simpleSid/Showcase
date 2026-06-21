const contactEmail = "hello@example.com";
const telegramUrl = "https://t.me/simpleSid";

const form = document.querySelector("[data-contact-form]");
const statusNode = document.querySelector("[data-form-status]");
const telegramLinks = document.querySelectorAll("[data-telegram-link]");

telegramLinks.forEach((link) => {
  link.href = telegramUrl;
});

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const contact = String(data.get("contact") || "").trim();
    const message = String(data.get("message") || "").trim();

    const subject = encodeURIComponent("Заявка на лендинг");
    const body = encodeURIComponent(
      `Имя: ${name}\nКонтакт: ${contact}\n\nЧто нужно сделать:\n${message}`
    );

    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;

    if (statusNode) {
      statusNode.textContent = "Открыл почтовый клиент. Если письмо не появилось, напиши в Telegram.";
    }
  });
}
