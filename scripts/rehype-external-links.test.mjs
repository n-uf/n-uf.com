// Tests for src/data/rehype-external-links.mjs on small hast trees. Run: node --test scripts/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import rehypeExternalLinks, { extArrow } from "../src/data/rehype-external-links.mjs";

const isExternal = (href) => /^https?:\/\/(?!n-uf\.com(\/|$))/.test(href);
const NOTE = " (opens in a new tab)";
const link = (href, text = "text") => ({ type: "element", tagName: "a", properties: { href }, children: [{ type: "text", value: text }] });
const el = (tagName, ...children) => ({ type: "element", tagName, properties: {}, children });
const process = (...blocks) => {
  const tree = { type: "root", children: blocks };
  rehypeExternalLinks({ isExternal, note: NOTE })()(tree);
  return tree.children;
};
const run = (...links) => process(el("p", ...links))[0].children;

test("an external link opens in a new tab with rel noopener, the drawn arrow and a screen-reader note", () => {
  const [a] = run(link("https://developer.mozilla.org/en-US/docs/Web/CSS/@page", "MDN"));
  assert.equal(a.properties.target, "_blank");
  assert.deepEqual(a.properties.rel, ["noopener"]);
  assert.equal(a.children.length, 3);
  assert.deepEqual(a.children[1], extArrow());
  // the arrow is an SVG, not a "↗" a font has to carry (no font of the site has U+2197)
  const [arrowSvg] = a.children[1].children;
  assert.deepEqual(a.children[1].properties, { className: ["ext-arrow"], ariaHidden: "true" });
  assert.equal(arrowSvg.tagName, "svg");
  assert.equal(arrowSvg.children[0].tagName, "path");
  assert.ok(!JSON.stringify(a.children[1]).includes("↗"));
  assert.deepEqual(a.children[2], { type: "element", tagName: "span", properties: { className: ["sr-only"] }, children: [{ type: "text", value: NOTE }] });
});

test("links to this site, relative links and anchors are left alone", () => {
  for (const href of ["/papyrus", "/papyrus/x", "https://n-uf.com/papyrus", "#section"]) {
    const [a] = run(link(href));
    assert.equal(a.properties.target, undefined, href);
    assert.equal(a.properties.rel, undefined, href);
    assert.equal(a.children.length, 1, href);
  }
});

test("a link nested in other elements is found, and an <a> with no href is skipped", () => {
  const nested = el("em", link("https://github.com/n-uf/papyrus"));
  const [em, bare] = run(nested, el("a"));
  assert.equal(em.children[0].properties.target, "_blank");
  assert.equal(bare.properties.target, undefined);
});

test("in a heading the link opens in a new tab but gets no arrow and no note, so they stay out of the id and the contents", () => {
  for (const tag of ["h1", "h2", "h3", "h6"]) {
    const [h] = process(el(tag, { type: "text", value: "See " }, el("em", link("https://github.com/n-uf/papyrus", "the repo"))));
    const a = h.children[1].children[0];
    assert.equal(a.properties.target, "_blank", tag);
    assert.deepEqual(a.properties.rel, ["noopener"], tag);
    assert.equal(a.children.length, 1, tag);
  }
  // the next paragraph is not a heading
  const [, p] = process(el("h2", link("https://github.com/a")), el("p", link("https://github.com/b")));
  assert.equal(p.children[0].children.length, 3);
});
