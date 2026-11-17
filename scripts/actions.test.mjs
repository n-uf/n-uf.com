// Tests for src/data/actions.mjs: where the calls to action go in an article's body, and what they look like.
// Run: node --test scripts/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { HEAD, MAX, MIN_GAP, TAIL, actionHtml, blocks, needWords, places, withActions } from "../src/data/actions.mjs";

const isExternal = (href) => /^https?:\/\/(?!n-uf\.com)/.test(href);
const note = " (opens in a new tab)";
const action = (n) => ({ heading: `Heading ${n} for a page`, text: `One plain sentence, number ${n}, about a live demo and a private package.`, label: `Open demo ${n}`, href: "https://kit.n-uf.com/demo" });
const opts = { page: "/kit/some-page", mainKeyword: "react theme switcher component", isExternal, note };

/** A paragraph of exactly n words; the first one names the need when `need` is set. */
const para = (n, need = false) => `<p>${(need ? "theme switcher " : "") + Array.from({ length: need ? n - 2 : n }, (_, i) => `w${i}`).join(" ")}</p>`;
const doc = (...parts) => parts.join("\n");
/** The word count before each action block in the output, and the output's total without them. */
function positions(html) {
  const words = (s) => (s.replace(/<[^>]+>/g, " ").match(/[\p{L}\p{N}][\p{L}\p{N}'’_-]*/gu) ?? []).length;
  const at = [];
  let rest = html;
  let before = 0;
  for (;;) {
    const m = /<aside class="kit-cta".*?<\/aside>/s.exec(rest);
    if (!m) break;
    at.push(before + words(rest.slice(0, m.index)));
    before += words(rest.slice(0, m.index));
    rest = rest.slice(m.index + m[0].length);
  }
  return { at, total: before + words(rest) };
}

test("a page with no actions comes back as it was", () => {
  const html = doc(para(400), para(400));
  assert.equal(withActions(html, undefined, opts), html);
  assert.equal(withActions(html, [], opts), html);
});

test("the first one comes after the opening answer, as early as the text allows", () => {
  const html = doc(...Array.from({ length: 12 }, () => para(100)));
  const { at } = positions(withActions(html, [action(1)], opts));
  assert.equal(at.length, 1);
  assert.ok(at[0] >= HEAD, `at ${at[0]}`);
  assert.ok(at[0] <= HEAD + 100, `at ${at[0]}`);
});

test("never in the last TAIL words, at least MIN_GAP apart, at most one per action", () => {
  const html = doc(...Array.from({ length: 14 }, () => para(100)));
  const out = withActions(html, [action(1), action(2), action(3)], opts);
  const { at, total } = positions(out);
  assert.ok(at.length >= 2 && at.length <= 3, `${at.length} placed`);
  for (const w of at) assert.ok(w <= total - TAIL, `at ${w} of ${total}`);
  for (let i = 1; i < at.length; i++) assert.ok(at[i] - at[i - 1] >= MIN_GAP, `${at}`);
  assert.equal(withActions(html, [action(1)], opts).split('class="kit-cta"').length - 1, 1);
});

test("at most MAX, even when more actions are given", () => {
  const html = doc(...Array.from({ length: 40 }, () => para(100)));
  const four = [1, 2, 3, 4].map(action);
  assert.ok(withActions(html, four, opts).split('class="kit-cta"').length - 1 <= MAX);
});

test("a text too short to hold one gets none", () => {
  const html = doc(para(200), para(200));
  assert.equal(withActions(html, [action(1)], opts), html);
});

test("never right before a list, a table or a code block, nor after a sentence that ends in a colon", () => {
  const html = doc(
    para(150),
    para(150, true),
    "<p>Here are the steps:</p>",
    "<ul><li>one</li><li>two</li></ul>",
    para(150),
    "<pre><code>x</code></pre>",
    para(150),
    para(300),
  );
  const out = withActions(html, [action(1), action(2)], opts);
  for (const m of out.matchAll(/<\/aside>\s*<(\w+)/g)) assert.ok(!["ul", "ol", "table", "pre"].includes(m[1]), `before ${m[1]}`);
  assert.ok(!/steps:<\/p>\s*<aside/.test(out));
});

test("never inside a run of paragraphs that open in bold", () => {
  const bold = (n) => `<p><strong>Lead ${n}.</strong> ${Array.from({ length: 120 }, (_, i) => `w${i}`).join(" ")}</p>`;
  const html = doc(para(200), bold(1), bold(2), bold(3), bold(4), para(120), para(300));
  const out = withActions(html, [action(1)], opts);
  assert.equal(out.split('class="kit-cta"').length - 1, 1);
  assert.doesNotMatch(out, /<p><strong>[^<]*<\/strong>[^<]*<\/p>\s*<aside/, "not after a bold-lead paragraph of the run");
  assert.match(out, /w119<\/p>\n<aside/, "after the plain paragraph that follows the run");
});

test("a paragraph that names the need is preferred near the mark", () => {
  const html = doc(para(150), para(150), para(100), para(100, true), para(100), para(100), para(300));
  const out = withActions(html, [action(1)], opts);
  const before = out.slice(0, out.indexOf('<aside class="kit-cta"'));
  assert.ok(/theme switcher/.test(before.split("</p>").at(-2) ?? ""), "after the paragraph with the keyword");
});

test("the same page gets the same places on every build", () => {
  const html = doc(...Array.from({ length: 14 }, () => para(100)));
  assert.deepEqual(places(html, 3, opts), places(html, 3, opts));
});

test("the button: external link opens in a new tab with a note for screen readers, text is escaped", () => {
  const out = actionHtml({ heading: "A & B <x>", text: "Plain \"sentence\".", label: "Open it", href: "https://kit.n-uf.com/a?b=1&c=2" }, 1, { isExternal, note });
  assert.match(out, /<aside class="kit-cta" aria-labelledby="cta-1"/);
  assert.match(out, /<h3 class="kit-cta-title" id="cta-1">A &amp; B &lt;x&gt;<\/h3>/);
  assert.match(out, /href="https:\/\/kit\.n-uf\.com\/a\?b=1&amp;c=2" target="_blank" rel="noopener"/);
  assert.match(out, /<span class="sr-only"> \(opens in a new tab\)<\/span>/);
  assert.equal(out.split("<a ").length - 1, 1, "one button");
});

test("a link on this site stays in the tab", () => {
  const out = actionHtml({ ...action(1), href: "https://n-uf.com/harbuz" }, 1, { isExternal, note });
  assert.doesNotMatch(out, /target=/);
  assert.doesNotMatch(out, /sr-only/);
});

test("needWords drops the generic words of a keyword", () => {
  assert.deepEqual(needWords("react theme switcher component"), ["theme", "switcher"]);
  assert.deepEqual(needWords("react pdf viewer custom toolbar"), ["pdf", "viewer", "custom", "toolbar"]);
});

test("blocks counts words per top-level block and knows the next one", () => {
  const bs = blocks("<p>a b c</p><ul><li>x y</li></ul><p>z</p>");
  assert.deepEqual(bs.map((b) => [b.tag, b.cum, b.nextTag]), [["p", 3, "ul"], ["ul", 5, "p"], ["p", 6, ""]]);
});
