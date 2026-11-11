// Tests for src/data/article-pdfs.mjs: which PDFs a build publishes, and when the Download PDF button shows.
// Run: node --test scripts/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { copyShownPdfs, liveDatesTrailer, pdfLink, shownSlugs, showsDrafts } from "../src/data/article-pdfs.mjs";

/** a site root with a live article, a draft, a draft written `True # note`, and a PDF for each (and one article with none) */
function site() {
  const root = mkdtempSync(join(tmpdir(), "article-pdfs-"));
  const content = join(root, "src/content/papyrus");
  const pdfs = join(root, "src/article-pdfs");
  mkdirSync(content, { recursive: true });
  mkdirSync(pdfs, { recursive: true });
  const page = (draft) => `---\ntitle: x\n${draft}\n---\nBody\n`;
  writeFileSync(join(content, "live.md"), page("draft: false"));
  writeFileSync(join(content, "scheduled.md"), page("draft: true"));
  writeFileSync(join(content, "shouting.md"), page("draft: True   # on 17 Dec"));
  writeFileSync(join(content, "nopdf.md"), page("draft: false"));
  for (const slug of ["live", "scheduled", "shouting"]) writeFileSync(join(pdfs, `${slug}.pdf`), "%PDF-1.4");
  writeFileSync(join(pdfs, "sizes.json"), JSON.stringify({
    live: { bytes: 170000, pages: 5 }, scheduled: { bytes: 2048, pages: 1 }, shouting: { bytes: 100, pages: 2 }, nopdf: { bytes: 1, pages: 1 },
  }));
  return root;
}
const listed = (outDir) => (existsSync(join(outDir, "papyrus/pdf")) ? readdirSync(join(outDir, "papyrus/pdf")).sort() : []);

test("production copies only the PDFs of live articles", () => {
  const root = site();
  const out = mkdtempSync(join(tmpdir(), "article-pdfs-out-"));
  assert.deepEqual(copyShownPdfs({ root, outDir: out, showDrafts: false }), ["live"]);
  assert.deepEqual(listed(out), ["live.pdf"]);
});

test("a build with only drafts publishes no PDF and makes no papyrus/pdf folder", () => {
  const root = mkdtempSync(join(tmpdir(), "article-pdfs-"));
  mkdirSync(join(root, "src/content/papyrus"), { recursive: true });
  mkdirSync(join(root, "src/article-pdfs"), { recursive: true });
  writeFileSync(join(root, "src/content/papyrus/a.md"), "---\ndraft: true\n---\n");
  writeFileSync(join(root, "src/article-pdfs/a.pdf"), "%PDF");
  const out = mkdtempSync(join(tmpdir(), "article-pdfs-out-"));
  assert.deepEqual(copyShownPdfs({ root, outDir: out, showDrafts: false }), []);
  assert.deepEqual(listed(out), []);
});

test("a preview copies the draft PDFs too", () => {
  const root = site();
  const out = mkdtempSync(join(tmpdir(), "article-pdfs-out-"));
  assert.deepEqual(copyShownPdfs({ root, outDir: out, showDrafts: true }).sort(), ["live", "scheduled", "shouting"]);
});

test("the rule for drafts is the pages': VERCEL_ENV=preview shows them, production and no VERCEL_ENV hide them", () => {
  assert.equal(showsDrafts({ VERCEL_ENV: "preview" }), true);
  assert.equal(showsDrafts({ VERCEL_ENV: "production" }), false);
  assert.equal(showsDrafts({}), false);
  const root = site();
  assert.deepEqual(shownSlugs(root, false), ["live", "nopdf"]);
});

test("the button shows only when the article's PDF exists, with its pages and size", () => {
  const root = site();
  assert.deepEqual(pdfLink("live", root), {
    href: "/papyrus/pdf/live.pdf", file: "live.pdf", label: "A4 · 5 p · 166 KB", aria: "Download PDF, A4, 5 pages, 166 KB",
  });
  assert.equal(pdfLink("scheduled", root)?.label, "A4 · 1 p · 2 KB");
  assert.equal(pdfLink("scheduled", root)?.aria, "Download PDF, A4, 1 page, 2 KB");
  assert.equal(pdfLink("nopdf", root), null);      // sizes.json knows it, the file doesn't exist
  assert.equal(pdfLink("unknown", root), null);    // no entry at all
  assert.equal(pdfLink("live", mkdtempSync(join(tmpdir(), "article-pdfs-empty-"))), null);   // no src/article-pdfs
});

test("the fingerprinted trailer lists the go-live day of each article a {{live:}} block points at", () => {
  const root = mkdtempSync(join(tmpdir(), "article-pdfs-live-"));
  const content = join(root, "src/content/papyrus");
  mkdirSync(content, { recursive: true });
  const dated = (day) => `---\ntitle: x\npublished: ${day}\n---\nBody\n`;
  writeFileSync(join(content, "later.md"), dated("2026-12-01"));
  writeFileSync(join(content, "stamped.md"), dated("2026-12-08T23:30:00-05:00"));
  const text = "Intro. {{live:/papyrus/later}}A.{{/live}} {{live:/papyrus/stamped/}}B.{{/live}} {{live:/papyrus}}C.{{/live}} {{live:/papyrus/missing}}D.{{/live}}\n";
  assert.equal(liveDatesTrailer(text, root), [
    "", "<!-- live-from /papyrus/later 2026-12-01 -->", "<!-- live-from /papyrus/missing none -->",
    "<!-- live-from /papyrus/stamped 2026-12-09 -->", "",
  ].join("\n"));
  // moving a date changes the trailer, so the PDF is reprinted
  writeFileSync(join(content, "later.md"), dated("2026-12-02"));
  assert.match(liveDatesTrailer(text, root), /\/papyrus\/later 2026-12-02/);
  assert.equal(liveDatesTrailer("No blocks here.\n", root), "");
});
