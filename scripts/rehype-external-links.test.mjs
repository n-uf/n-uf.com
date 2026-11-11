// Tests for src/data/rehype-external-links.mjs on small hast trees. Run: node --test scripts/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import rehypeExternalLinks from "../src/data/rehype-external-links.mjs";

const isExternal = (href) => /^https?:\/\/(?!n-uf\.com(\/|$))/.test(href);
const NOTE = " (opens in a new tab)";
const link = (href, text = "text") => ({ type: "element", tagName: "a", properties: { href }, children: [{ type: "text", value: text }] });
const run = (...links) => {
  const tree = { type: "root", children: [{ type: "element", tagName: "p", properties: {}, children: links }] };
  rehypeExternalLinks({ isExternal, note: NOTE })()(tree);
  return tree.children[0].children;
};

test("an external link opens in a new tab with rel noopener and a screen-reader note", () => {
  const [a] = run(link("https://developer.mozilla.org/en-US/docs/Web/CSS/@page", "MDN"));
  assert.equal(a.properties.target, "_blank");
  assert.deepEqual(a.properties.rel, ["noopener"]);
  assert.deepEqual(a.children.at(-1), { type: "element", tagName: "span", properties: { className: ["sr-only"] }, children: [{ type: "text", value: NOTE }] });
  assert.equal(a.children.length, 2);
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
  const nested = { type: "element", tagName: "em", properties: {}, children: [link("https://github.com/n-uf/papyrus")] };
  const [em, bare] = run(nested, { type: "element", tagName: "a", properties: {}, children: [] });
  assert.equal(em.children[0].properties.target, "_blank");
  assert.equal(bare.properties.target, undefined);
});
