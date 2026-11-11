// The PDF of each article: printed by papyrus from the article's own page (scripts/article-pdfs.mjs), kept in
// src/article-pdfs/<slug>.pdf with sizes.json (bytes and pages per slug), and published at /papyrus/pdf/<slug>.pdf.
//
// A PDF is never in public/: a committed PDF of a draft would be readable on production before its date. The build
// copies only the PDFs of the articles it shows (production: live ones; Vercel previews: all), by the same rule as
// the pages (src/data/articles.ts: `draft: true` hides, VERCEL_ENV=preview shows).
// Plain JS with no Astro imports, so the config, the script and the tests can load it.
import fs from "node:fs";
import path from "node:path";
import { isDraft } from "./front-matter.mjs";

export const PDF_DIR = "src/article-pdfs";
export const PDF_URL = "/papyrus/pdf";
const SECTION_DIR = "src/content/papyrus";

/** Does this build show drafts (and so their PDFs)? Previews do; production and a plain build don't. */
export const showsDrafts = (env = process.env) => env.VERCEL_ENV === "preview";

/** The slugs of every article file (drafts too), sorted. */
export function articleSlugs(root = process.cwd()) {
  const dir = path.join(root, SECTION_DIR);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3)).sort();
}

/** The slugs this build shows: the live articles, plus drafts when `showDrafts`. */
export function shownSlugs(root, showDrafts) {
  return articleSlugs(root).filter((slug) => showDrafts || !isDraft(fs.readFileSync(path.join(root, SECTION_DIR, `${slug}.md`), "utf8")));
}

/** sizes.json as { slug: { bytes, pages } }; {} when absent. */
export function readSizes(root = process.cwd()) {
  const file = path.join(root, PDF_DIR, "sizes.json");
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
}

/** The Download PDF button's address and label for an article, or null when its PDF doesn't exist. */
export function pdfLink(slug, root = process.cwd()) {
  const size = readSizes(root)[slug];
  if (!size || !fs.existsSync(path.join(root, PDF_DIR, `${slug}.pdf`))) return null;
  const pages = `${size.pages} ${size.pages === 1 ? "page" : "pages"}`;
  return { href: `${PDF_URL}/${slug}.pdf`, label: `Download PDF · ${pages} · ${Math.max(1, Math.round(size.bytes / 1024))} KB` };
}

/**
 * Copies the PDFs of the articles this build shows into `<outDir>/papyrus/pdf/`. Returns the slugs copied.
 * A draft's PDF is copied only when `showDrafts`, so production never ships one.
 */
export function copyShownPdfs({ root = process.cwd(), outDir, showDrafts }) {
  const copied = [];
  for (const slug of shownSlugs(root, showDrafts)) {
    const from = path.join(root, PDF_DIR, `${slug}.pdf`);
    if (!fs.existsSync(from)) continue;
    const to = path.join(outDir, PDF_URL, `${slug}.pdf`);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
    copied.push(slug);
  }
  return copied;
}
