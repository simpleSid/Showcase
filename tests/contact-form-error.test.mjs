import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

const readRule = (selector) => {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{(?<body>[^}]*)\\}`));

  assert.ok(match?.groups?.body, `Missing CSS rule for ${selector}`);
  return match.groups.body;
};

test("field error floats without moving subsequent form fields", () => {
  const errorLabelRule = readRule(".contact-form label.has-error");

  assert.doesNotMatch(errorLabelRule, /margin-bottom/);
});

test("field error uses a white bubble with a black outline", () => {
  const fieldErrorRule = readRule(".field-error");

  assert.match(fieldErrorRule, /background:\s*oklch\(0\.995 0 0\)/);
  assert.match(fieldErrorRule, /border:\s*1px solid var\(--ink\)/);
  assert.match(fieldErrorRule, /color:\s*var\(--ink\)/);
  assert.doesNotMatch(fieldErrorRule, /0\.018 150|0\.075 160/);
});

test("visible field error hangs two thirds below the input edge", () => {
  const fieldErrorRule = readRule(".field-error");
  const visibleFieldErrorRule = readRule(".field-error.is-visible");

  assert.match(fieldErrorRule, /top:\s*100%/);
  assert.match(visibleFieldErrorRule, /transform:\s*translate3d\(0, -33%, 0\) scale\(1\)/);
});

test("telegram contact link lives in the form as an icon under the submit button", () => {
  assert.doesNotMatch(html, /class="telegram-link"/);

  const formActionsMatch = html.match(/<div class="form-actions">(?<body>[\s\S]*?)<\/div>/);
  assert.ok(formActionsMatch?.groups?.body, "Missing form actions block");

  const formActions = formActionsMatch.groups.body;
  assert.match(formActions, /<button class="button button-dark" type="submit">Отправить<\/button>/);
  assert.match(formActions, /<a class="form-telegram-link" data-telegram-link href="https:\/\/t\.me\/JustaSid" aria-label="Написать в Telegram">/);
  assert.ok(
    formActions.indexOf("button-dark") < formActions.indexOf("form-telegram-link"),
    "Telegram link should be placed after the submit button",
  );
  assert.match(
    formActions,
    /<img\s+src="assets\/icon-telegram\.svg"\s+alt=""\s+width="22"\s+height="22"\s+loading="lazy"\s+\/>/,
  );
});

test("telegram form link keeps the actions vertical and has an accessible focus state", () => {
  const formActionsRule = readRule(".contact-form .form-actions");
  const telegramRule = readRule(".form-telegram-link");
  const focusRule = readRule(".form-telegram-link:focus-visible");

  assert.match(formActionsRule, /flex-direction:\s*column/);
  assert.match(formActionsRule, /justify-self:\s*start/);
  assert.match(formActionsRule, /align-items:\s*center/);
  assert.match(telegramRule, /width:\s*44px/);
  assert.match(telegramRule, /height:\s*44px/);
  assert.match(telegramRule, /border-radius:\s*50%/);
  assert.match(focusRule, /outline:\s*3px solid/);
  assert.match(focusRule, /outline-offset:\s*5px/);
});
