// Tests for src/data/live-blocks.mjs ({{live:/path}}…{{/live}}) with a fake "is this path built" lookup.
// Run: node --test scripts/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyLiveBlocks, dropLateLiveBlocks, liveTargets } from "../src/data/live-blocks.mjs";

const PAGES = {
  "/papyrus/live-page": "built",
  "/papyrus/draft-page": "unbuilt", // a draft in production
  "/papyrus": "built",
};
const status = (p) => PAGES[p] ?? "none";
const run = (html) => applyLiveBlocks(html, status, "src/content/papyrus/host.md");
const fails = (html, re) => assert.throws(() => run(html), (e) => re.test(e.message) && e.message.startsWith("src/content/papyrus/host.md: "));

const link = '<a href="/papyrus/draft-page">the draft</a>';

test("a block whose target is built keeps its inner HTML and loses the markers", () => {
  assert.equal(run('<p>One. {{live:/papyrus/live-page}}See <a href="/papyrus/live-page">it</a>.{{/live}} Two.</p>'),
    '<p>One. See <a href="/papyrus/live-page">it</a>. Two.</p>');
});

test("a fixed page counts as built, and a path with a trailing slash is accepted", () => {
  assert.equal(run("<p>{{live:/papyrus/}}Read about papyrus.{{/live}}</p>"), "<p>Read about papyrus.</p>");
  assert.equal(run("<p>{{live:/papyrus/live-page/}}Read it.{{/live}}</p>"), "<p>Read it.</p>");
});

test("a draft target: the block is removed, markers and inner link included", () => {
  assert.equal(run(`<p>One. {{live:/papyrus/draft-page}}See ${link}.{{/live}} Two.</p>`), "<p>One. Two.</p>");
});

test("a removed block at the end of a paragraph takes the space before it", () => {
  assert.equal(run(`<p>One. {{live:/papyrus/draft-page}}See ${link}.{{/live}}</p>`), "<p>One.</p>");
});

test("a paragraph that was only the block is dropped, not left as <p></p>", () => {
  assert.equal(run(`<p>Before.</p>\n<p>{{live:/papyrus/draft-page}}See ${link}.{{/live}}</p>\n<p>After.</p>`),
    "<p>Before.</p>\n<p>After.</p>");
});

test("a list item that was only the block is dropped too", () => {
  assert.equal(run(`<ul>\n<li>A</li>\n<li>{{live:/papyrus/draft-page}}${link}{{/live}}</li>\n</ul>`), "<ul>\n<li>A</li>\n</ul>");
});

test("several blocks in one page are resolved one by one", () => {
  assert.equal(run(`<p>{{live:/papyrus/live-page}}A.{{/live}} {{live:/papyrus/draft-page}}B.{{/live}} C.</p>`), "<p>A. C.</p>");
});

test("a block may span lines inside one paragraph", () => {
  assert.equal(run("<p>{{live:/papyrus/live-page}}one\ntwo{{/live}}</p>"), "<p>one\ntwo</p>");
});

test("html with no block comes back unchanged, empty paragraphs included", () => {
  const html = "<p>Plain.</p>\n<p></p>\n";
  assert.equal(run(html), html);
});

test("a target that is no page at all fails, built or not", () => {
  fails("<p>{{live:/papyrus/nope}}x{{/live}}</p>", /\/papyrus\/nope is no page/);
});

test("a target that isn't a site path fails", () => {
  fails("<p>{{live:https://example.com/}}x{{/live}}</p>", /not a site path/);
  fails("<p>{{live:}}x{{/live}}</p>", /not a site path/);
  fails("<p>{{live:/Papyrus/X y}}x{{/live}}</p>", /not a site path/);
});

test("a nested block fails", () => {
  fails("<p>{{live:/papyrus/live-page}}a {{live:/papyrus}}b{{/live}} c{{/live}}</p>", /nested/);
});

test("a stray {{/live}} fails", () => {
  fails("<p>text{{/live}}</p>", /stray \{\{\/live\}\}/);
  fails("<p>{{live:/papyrus}}a{{/live}}{{/live}}</p>", /stray \{\{\/live\}\}/);
});

test("a {{live:}} never closed fails", () => {
  fails("<p>{{live:/papyrus}}text</p>", /never closed/);
});

test("a malformed marker fails as stray", () => {
  fails("<p>{{live:/papyrus}text{{/live}}</p>", /stray|never closed|not a site path/);
  fails("<p>{{ live:/papyrus }}text</p>", /stray/);
});

test("a block that spans paragraphs fails", () => {
  fails("<p>{{live:/papyrus/live-page}}one</p>\n<p>two{{/live}}</p>", /spans more than one paragraph/);
});

test("a block that contains a list or a heading fails", () => {
  fails("<p>{{live:/papyrus}}x<ul><li>y</li></ul>{{/live}}</p>", /spans more than one paragraph/);
  fails("<h2>{{live:/papyrus}}x</h2><p>y{{/live}}</p>", /inside a heading|spans more than one paragraph/);
});

test("a block inside a heading fails, built or not (an empty heading, raw markers in the table of contents)", () => {
  fails('<h2 id="a">{{live:/papyrus}}Read about it{{/live}}</h2>', /inside a heading/);
  fails("<h3>Next {{live:/papyrus/draft-page}}step{{/live}}</h3>", /inside a heading/);
  // after a closed heading, a block in the next paragraph is fine
  assert.equal(run("<h2>Title</h2>\n<p>{{live:/papyrus}}Read about it.{{/live}}</p>"), "<h2>Title</h2>\n<p>Read about it.</p>");
});

test("a loose list item (<li><p>…</p></li>) that was only a removed block goes, and so does a list left empty", () => {
  assert.equal(run(`<ul>\n<li>\n<p>Keep.</p>\n</li>\n<li>\n<p>{{live:/papyrus/draft-page}}See ${link}.{{/live}}</p>\n</li>\n</ul>`),
    "<ul>\n<li>\n<p>Keep.</p>\n</li>\n</ul>");
  assert.equal(run(`<p>Before.</p>\n<ul>\n<li>{{live:/papyrus/draft-page}}See ${link}.{{/live}}</li>\n</ul>\n<p>After.</p>`),
    "<p>Before.</p>\n<p>After.</p>");
});

test("liveTargets lists every target once, in canonical form", () => {
  const html = "<p>{{live:/papyrus/a/}}x{{/live}} {{live: /papyrus/b }}y{{/live}} {{live:/papyrus/a}}z{{/live}}</p>";
  assert.deepEqual([...liveTargets(html)], ["/papyrus/a", "/papyrus/b"]);
  assert.deepEqual([...liveTargets("<p>none</p>")], []);
});

// The print layout: a PDF keeps a block only when its target goes live on or before the article's own go-live day.
const FROM = { "/papyrus/draft-page": "2026-12-01", "/papyrus/live-page": "2026-11-10" };
const marked = (html) => applyLiveBlocks(html, status, "src/content/papyrus/host.md", (p) => FROM[p]);
const spanOf = (day, inner) => `<span data-live-from="${day}">${inner}</span><!--/live-from-->`;

test("a kept block carries the day its target goes live; a fixed page has none", () => {
  assert.equal(marked("<p>One. {{live:/papyrus/live-page}}See it.{{/live}} Two. {{live:/papyrus}}Read.{{/live}}</p>"),
    `<p>One. ${spanOf("2026-11-10", "See it.")} Two. Read.</p>`);
});

test("a block whose target is hidden in this build is still removed, and gets no marker", () => {
  assert.equal(marked(`<p>One. {{live:/papyrus/draft-page}}See ${link}.{{/live}} Two.</p>`), "<p>One. Two.</p>");
});

test("dropLateLiveBlocks keeps a block that is live by the article's day and unwraps it", () => {
  const html = `<p>One. ${spanOf("2026-11-10", "See it.")} Two.</p>`;
  assert.equal(dropLateLiveBlocks(html, "2026-11-24"), "<p>One. See it. Two.</p>");
  assert.equal(dropLateLiveBlocks(html, "2026-11-10"), "<p>One. See it. Two.</p>");   // the same day counts
});

test("dropLateLiveBlocks removes a block whose target goes live after the article, as a production build would", () => {
  const html = `<p>One. ${spanOf("2026-12-01", "See later.")} Two.</p>\n<p>${spanOf("2026-12-01", "Only this.")}</p>\n<ul>\n<li>A</li>\n<li>${spanOf("2026-12-08", "Later.")}</li>\n</ul>\n<p>End. ${spanOf("2026-12-01", "Tail.")}</p>`;
  assert.equal(dropLateLiveBlocks(html, "2026-11-24"), "<p>One. Two.</p>\n<ul>\n<li>A</li>\n</ul>\n<p>End.</p>");
});

test("dropLateLiveBlocks leaves html with no marker unchanged", () => {
  const html = "<p>Plain.</p>\n<p></p>\n";
  assert.equal(dropLateLiveBlocks(html, "2026-11-24"), html);
});

test("the print layout of a block is what the production build of that day makes of it", () => {
  // article live on 2026-11-24; its sentence about a page live on 2026-12-01 is in the preview but not in production
  const body = "<p>Intro. {{live:/papyrus/draft-page}}Later page: see it.{{/live}} Outro.</p>";
  const production = applyLiveBlocks(body, status, "x.md");
  const printed = dropLateLiveBlocks(applyLiveBlocks(body, () => "built", "x.md", (p) => FROM[p]), "2026-11-24");
  assert.equal(printed, production);
});

test("a removed block with no space before it and text after keeps one space between the sentences", () => {
  assert.equal(run(`<p>One.{{live:/papyrus/draft-page}} See ${link}.{{/live}} Two.</p>`), "<p>One. Two.</p>");
  assert.equal(run(`<li>Split it by you.{{live:/papyrus/draft-page}} ${link} tells you how.{{/live}} Count the pages.</li>`),
    "<li>Split it by you. Count the pages.</li>");
  // and not at the start of a block, where there is nothing to separate
  assert.equal(run(`<p>{{live:/papyrus/draft-page}}See ${link}.{{/live}} Two.</p>`), "<p>Two.</p>");
  assert.equal(dropLateLiveBlocks(`<p>One.${spanOf("2026-12-01", " See later.")} Two.</p>`, "2026-11-24"), "<p>One. Two.</p>");
});
