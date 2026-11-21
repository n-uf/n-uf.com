// Tests for scripts/check-notes-build.mjs: what a built site must hold for the notes section. While no note is live there
// is no section at all: nothing under /notes in the built folder, the sitemap, llms.txt or any page's links.
// The built folders here are small stand-ins; `pnpm build` runs the same check on the real build.
// Run: node --test scripts/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkNotesBuild } from "./check-notes-build.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE = readFileSync(join(here, "fixtures/notes/src/content/notes/fixture-draft-note.md"), "utf8");
const liveText = FIXTURE.replace("draft: true", "draft: false");

const put = (root, rel, text) => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), text);
};
const sitemap = (...paths) =>
  `<?xml version="1.0"?><urlset>${["/", ...paths].map((p) => `<url><loc>https://n-uf.com${p}</loc></url>`).join("")}</urlset>`;

/** A checkout with the given notes ({ slug: markdown }) and a built folder with the given extra files ({ path: text }) */
function site(notes, built = {}) {
  const root = mkdtempSync(join(tmpdir(), "notes-build-"));
  const dist = join(root, "dist");
  put(root, "src/content/notes/.gitkeep", "");
  for (const [slug, text] of Object.entries(notes)) put(root, `src/content/notes/${slug}.md`, text);
  put(dist, "index.html", '<html><body><a href="/papyrus">papyrus</a></body></html>');
  put(dist, "llms.txt", "# n-uf\n");
  put(dist, "sitemap-0.xml", sitemap("/papyrus"));
  put(dist, "sitemap-index.xml", '<sitemapindex><sitemap><loc>https://n-uf.com/sitemap-0.xml</loc></sitemap></sitemapindex>');
  for (const [rel, text] of Object.entries(built)) put(dist, rel, text);
  return { root, dist };
}
const check = (s, showDrafts = false) => checkNotesBuild({ root: s.root, dist: s.dist, showDrafts });

const indexHtml = (...slugs) =>
  `<html><head><link rel="alternate" type="application/rss+xml" title="n-uf notes" href="https://n-uf.com/notes/rss.xml"></head><body>${slugs.map((s) => `<a href="/notes/${s}">${s}</a>`).join("")}</body></html>`;
const feed = (...slugs) => `<rss>${slugs.map((s) => `<item><link>https://n-uf.com/notes/${s}</link></item>`).join("")}</rss>`;
const llms = (...slugs) => `# n-uf\n## Notes\n- Feed (RSS): https://n-uf.com/notes/rss.xml\n${slugs.map((s) => `- [x](https://n-uf.com/notes/${s}): d`).join("\n")}\n`;

// ---- no live note: the section does not exist
test("no note files at all: a build with nothing under /notes is fine", () => {
  assert.deepEqual(check(site({})), []);
});

test("only a draft note: a production build with no /notes, no feed and nothing in the sitemap is fine", () => {
  assert.deepEqual(check(site({ "fixture-draft-note": FIXTURE })), []);
});

test("a draft only: a /notes page, the feed or a note page is refused", () => {
  const s = site({ "fixture-draft-note": FIXTURE }, { "notes/index.html": indexHtml(), "notes/rss.xml": feed() });
  const problems = check(s);
  assert.ok(problems.some((p) => /but notes was built/.test(p)), problems.join("\n"));
});

test("a draft only: a /notes line in the sitemap is refused, the feed in it too", () => {
  const s = site({ "fixture-draft-note": FIXTURE }, { "sitemap-0.xml": sitemap("/papyrus", "/notes") });
  assert.ok(check(s).some((p) => /sitemap lists \/notes/.test(p)));
  const t = site({ "fixture-draft-note": FIXTURE }, { "sitemap-0.xml": sitemap("/papyrus", "/notes/rss.xml") });
  assert.ok(check(t).some((p) => /sitemap lists the feed/.test(p)));
});

test("a draft only: llms.txt mentioning /notes, or a page linking to /notes, is refused", () => {
  const s = site({ "fixture-draft-note": FIXTURE }, { "llms.txt": "# n-uf\nFeed: https://n-uf.com/notes/rss.xml\n" });
  assert.ok(check(s).some((p) => /llms\.txt mentions \/notes/.test(p)));
  const t = site({ "fixture-draft-note": FIXTURE }, { "index.html": '<footer><a href="/notes">Notes</a></footer>' });
  assert.ok(check(t).some((p) => /links to \/notes/.test(p)));
});

test("a draft only: another page's address that merely contains /notes in its path is not the section", () => {
  const s = site({ "fixture-draft-note": FIXTURE }, { "llms.txt": "# n-uf\n- [x](https://n-uf.com/papyrus/notes-on-print): d\n- https://github.com/n-uf/some/notes\n" });
  assert.deepEqual(check(s), []);
});

// ---- a live note: the section exists, and only the live notes are in it
test("a live note: /notes, the feed, the note, the sitemap and llms.txt are all there", () => {
  const s = site(
    { "fixture-draft-note": liveText },
    {
      "notes/index.html": indexHtml("fixture-draft-note"),
      "notes/rss.xml": feed("fixture-draft-note"),
      "notes/fixture-draft-note/index.html": "<html></html>",
      "sitemap-0.xml": sitemap("/papyrus", "/notes", "/notes/fixture-draft-note"),
      "llms.txt": llms("fixture-draft-note"),
    },
  );
  assert.deepEqual(check(s), []);
});

test("a live note and a draft: the draft has no page and is in no list, feed or sitemap", () => {
  const draftB = FIXTURE.replace("fixture-repro", "other");
  const base = {
    "notes/index.html": indexHtml("fixture-draft-note"),
    "notes/rss.xml": feed("fixture-draft-note"),
    "notes/fixture-draft-note/index.html": "<html></html>",
    "sitemap-0.xml": sitemap("/papyrus", "/notes", "/notes/fixture-draft-note"),
    "llms.txt": llms("fixture-draft-note"),
  };
  const notes = { "fixture-draft-note": liveText, "hidden-one": draftB };
  assert.deepEqual(check(site(notes, base)), []);
  // each leak is caught
  assert.ok(check(site(notes, { ...base, "notes/hidden-one/index.html": "<html></html>" })).some((p) => /draft hidden-one has a page/.test(p)));
  assert.ok(check(site(notes, { ...base, "notes/rss.xml": feed("fixture-draft-note", "hidden-one") })).some((p) => /draft hidden-one appears/.test(p)));
  assert.ok(check(site(notes, { ...base, "notes/index.html": indexHtml("fixture-draft-note", "hidden-one") })).some((p) => /draft hidden-one appears/.test(p)));
  assert.ok(check(site(notes, { ...base, "llms.txt": llms("fixture-draft-note", "hidden-one") })).some((p) => /draft hidden-one appears/.test(p)));
  assert.ok(check(site(notes, { ...base, "sitemap-0.xml": sitemap("/papyrus", "/notes", "/notes/fixture-draft-note", "/notes/hidden-one") })).some((p) => /draft hidden-one appears/.test(p)));
});

test("live notes are required in the feed, the sitemap and as pages", () => {
  const notes = { "fixture-draft-note": liveText };
  const ok = {
    "notes/index.html": indexHtml("fixture-draft-note"),
    "notes/rss.xml": feed("fixture-draft-note"),
    "notes/fixture-draft-note/index.html": "<html></html>",
    "sitemap-0.xml": sitemap("/papyrus", "/notes", "/notes/fixture-draft-note"),
    "llms.txt": llms("fixture-draft-note"),
  };
  assert.deepEqual(check(site(notes, ok)), []);
  assert.ok(check(site(notes, { ...ok, "notes/rss.xml": feed() })).some((p) => /feed has no item for the note/.test(p)));
  assert.ok(check(site(notes, { ...ok, "sitemap-0.xml": sitemap("/papyrus", "/notes") })).some((p) => /sitemap does not list \/notes\/fixture-draft-note/.test(p)));
  assert.ok(check(site(notes, { ...ok, "sitemap-0.xml": sitemap("/papyrus", "/notes/fixture-draft-note") })).some((p) => /sitemap does not list \/notes$/.test(p)));
  assert.ok(check(site(notes, { ...ok, "notes/index.html": "<html></html>" })).some((p) => /does not advertise its feed/.test(p)));
});

test("a live note, but no /notes page or feed was built", () => {
  const s = site({ "fixture-draft-note": liveText });
  const problems = check(s);
  assert.ok(problems.some((p) => /\/notes \(notes\/index\.html\) was not built/.test(p)), problems.join("\n"));
  assert.ok(problems.some((p) => /\/notes\/rss\.xml was not built/.test(p)));
});

// ---- a preview shows the draft
test("a preview build with only a draft has the section, and needs no sitemap line", () => {
  const s = site(
    { "fixture-draft-note": FIXTURE },
    {
      "notes/index.html": indexHtml("fixture-draft-note"),
      "notes/rss.xml": feed("fixture-draft-note"),
      "notes/fixture-draft-note/index.html": "<html></html>",
      "llms.txt": llms("fixture-draft-note"),
    },
  );
  assert.deepEqual(check(s, true), []);
  // and the same folder is wrong for a production build
  assert.ok(check(s, false).length > 0);
});
