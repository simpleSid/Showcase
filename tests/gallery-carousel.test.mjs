import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const js = readFileSync(new URL("../main.js", import.meta.url), "utf8");

test("projects gallery is a cursor-controlled carousel with two project slides", () => {
  assert.match(html, /data-project-carousel/);
  assert.equal(html.match(/data-carousel-slide/g)?.length, 2);
  assert.match(html, /data-carousel-prev/);
  assert.match(html, /data-carousel-next/);
  assert.match(html, /aria-label="Предыдущий проект"/);
  assert.match(html, /aria-label="Следующий проект"/);
});

test("project carousel controls show only previous and next arrows", () => {
  assert.doesNotMatch(html, /data-carousel-dot/);
  assert.doesNotMatch(html, /project-carousel-dots/);
  assert.doesNotMatch(css, /project-carousel-dots/);
  assert.doesNotMatch(js, /querySelectorAll\("\[data-carousel-dot\]"\)/);
});

test("projects gallery header does not show the projects summary block", () => {
  assert.doesNotMatch(html, /class="projects-summary"/);
  assert.doesNotMatch(html, /Сводка по галерее/);
  assert.doesNotMatch(css, /\.projects-summary/);
});

test("projects gallery contains only live project cards", () => {
  assert.doesNotMatch(html, /Show<wbr \/>case|Mobile Flow|project-slide-mobile/);
  assert.match(html, /Луи/);
  assert.match(html, /Child<wbr \/>Square/);
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

test("carousel offset calculation uses viewport content width", () => {
  assert.match(js, /getViewportContentWidth/);
  assert.match(js, /paddingLeft/);
  assert.match(js, /paddingRight/);
  assert.match(js, /track\.scrollWidth - viewportWidth/);
});
