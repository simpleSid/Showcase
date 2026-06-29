import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const js = readFileSync(new URL("../main.js", import.meta.url), "utf8");

test("projects gallery is a cursor-controlled carousel with four slides", () => {
  assert.match(html, /data-project-carousel/);
  assert.equal(html.match(/data-carousel-slide/g)?.length, 4);
  assert.match(html, /data-carousel-prev/);
  assert.match(html, /data-carousel-next/);
  assert.match(html, /aria-label="Предыдущий проект"/);
  assert.match(html, /aria-label="Следующий проект"/);
});

test("carousel has autoplay, drag navigation, and reduced-motion support", () => {
  assert.match(js, /initProjectCarousel/);
  assert.match(js, /setInterval/);
  assert.match(js, /pointerdown/);
  assert.match(js, /pointerup/);
  assert.match(js, /prefers-reduced-motion: reduce/);
});

test("active project slide uses the wide showcase treatment", () => {
  assert.match(css, /\.project-carousel/);
  assert.match(css, /\.project-track/);
  assert.match(css, /\.project-slide\.is-active/);
  assert.match(css, /cursor:\s*grab/);
  assert.match(css, /--slide-size:\s*min\(100%,\s*1320px\)/);
});

test("mobile flow slide uses a dedicated phone preview treatment", () => {
  assert.match(html, /class="project-slide project-slide-mobile"/);
  assert.match(css, /\.project-slide-mobile\s+\.project-media/);
  assert.match(css, /\.project-slide-mobile\s+\.project-media img/);
  assert.match(css, /object-position:\s*top center/);
});

test("carousel offset calculation uses viewport content width", () => {
  assert.match(js, /getViewportContentWidth/);
  assert.match(js, /paddingLeft/);
  assert.match(js, /paddingRight/);
  assert.match(js, /track\.scrollWidth - viewportWidth/);
});
