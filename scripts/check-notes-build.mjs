#!/usr/bin/env node
// Fails the build when the notes section in the built site does not match the notes' own front matter. Runs after
// `astro build` (see "build" in package.json), next to check-links.mjs.
//
//   node scripts/check-notes-build.mjs [dist-dir]     (default: dist)
//
// What a build must show (src/data/notes.mjs): the live notes, plus the drafts in a Vercel preview (VERCEL_ENV=preview).
//   - While it shows NO note, the section does not exist: no /notes page, no /notes/rss.xml, no note page, no /notes line
//     in the sitemap, in llms.txt, or as a link from any page (the home page).
//   - While it shows notes: /notes and /notes/rss.xml exist, each shown note has its page, the sitemap lists /notes and
//     the shown notes (production) and never the feed, and a note that is hidden (a draft, in production) has no page and
//     appears in no list, feed or sitemap.
// The notes are read from src/content/notes/*.md with the same reading of `draft:` as the publish flip and the sitemap
// (src/data/front-matter.mjs). Plain JS with no Astro imports, so scripts/notes-build.test.mjs can run it.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDraft } from "../src/data/front-matter.mjs";
import { showsDrafts } from "../src/data/article-pdfs.mjs";

const read = (file) => (existsSync(file) ? readFileSync(file, "utf8") : "");

/** The note files of a checkout: [{ slug, draft }] */
function notesOf(root) {
  const dir = join(root, "src/content/notes");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".md"))
    .map((d) => ({ slug: d.name.slice(0, -3), draft: isDraft(readFileSync(join(dir, d.name), "utf8")) }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* htmlFiles(p);
    else if (name.endsWith(".html")) yield p;
  }
}

/**
 * The problems of a build, as a list of sentences (empty: the section is as it should be).
 * @param {{ root: string, dist: string, showDrafts?: boolean }} input root: the checkout; dist: the built site
 * @returns {string[]}
 */
export function checkNotesBuild({ root, dist, showDrafts = false }) {
  const problems = [];
  const notes = notesOf(root);
  const shown = notes.filter((n) => showDrafts || !n.draft);
  const hidden = notes.filter((n) => !shown.includes(n));
  const sitemap = readdirSync(dist).filter((n) => /^sitemap.*\.xml$/.test(n)).map((n) => read(join(dist, n))).join("\n");
  const llms = read(join(dist, "llms.txt"));
  const notesLocs = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace(/\/$/, "")).filter((p) => p === "/notes" || p.startsWith("/notes/"));
  const exists = (rel) => existsSync(join(dist, rel));

  if (notesLocs.some((p) => p.endsWith(".xml"))) problems.push("the sitemap lists the feed; the feed is not a page");

  if (shown.length === 0) {
    for (const rel of ["notes", "notes.html"]) if (exists(rel)) problems.push(`no note is shown in this build, but ${rel} was built`);
    if (notesLocs.length > 0) problems.push(`no note is shown in this build, but the sitemap lists ${notesLocs.join(", ")}`);
    if (/https:\/\/n-uf\.com\/notes(?![\w-])/.test(llms)) problems.push("no note is shown in this build, but llms.txt mentions /notes");
    for (const file of htmlFiles(dist)) {
      if (/<a\b[^>]*\shref=["'](?:https:\/\/n-uf\.com)?\/notes(?:\/[^"']*)?["']/i.test(readFileSync(file, "utf8"))) {
        problems.push(`no note is shown in this build, but ${file.slice(dist.length)} links to /notes`);
      }
    }
    return problems;
  }

  if (!exists("notes/index.html")) problems.push("notes are shown in this build, but /notes (notes/index.html) was not built");
  if (!exists("notes/rss.xml")) problems.push("notes are shown in this build, but /notes/rss.xml was not built");
  const index = read(join(dist, "notes/index.html"));
  const feed = read(join(dist, "notes/rss.xml"));
  if (index && !/<link rel="alternate" type="application\/rss\+xml"[^>]*href="https:\/\/n-uf\.com\/notes\/rss\.xml"/.test(index)) {
    problems.push("/notes does not advertise its feed with <link rel=\"alternate\" type=\"application/rss+xml\">");
  }
  for (const { slug } of shown) {
    if (!exists(`notes/${slug}/index.html`)) problems.push(`the note ${slug} is shown in this build but has no page`);
    if (!feed.includes(`<link>https://n-uf.com/notes/${slug}</link>`)) problems.push(`the feed has no item for the note ${slug}`);
    if (!showDrafts && !notesLocs.includes(`/notes/${slug}`)) problems.push(`the sitemap does not list /notes/${slug}`);
  }
  if (!showDrafts && !notesLocs.includes("/notes")) problems.push("the sitemap does not list /notes");
  if (llms && !llms.includes("/notes/rss.xml")) problems.push("llms.txt does not name the feed although notes are shown");
  for (const { slug } of hidden) {
    const url = `/notes/${slug}`;
    if (exists(`notes/${slug}`) || exists(`notes/${slug}.html`)) problems.push(`the draft ${slug} has a page in this build`);
    if (feed.includes(`${url}<`) || index.includes(`"${url}"`) || llms.includes(`${url})`) || notesLocs.includes(url)) {
      problems.push(`the draft ${slug} appears in the feed, the index, llms.txt or the sitemap`);
    }
  }
  return problems;
}

// run only as a script, so the tests can import checkNotesBuild()
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const here = dirname(fileURLToPath(import.meta.url));
  const dist = resolve(process.argv[2] ?? "dist");
  if (!existsSync(dist)) {
    console.error(`check-notes-build: ${dist} does not exist; run astro build first`);
    process.exit(1);
  }
  const root = resolve(here, "..");
  const problems = checkNotesBuild({ root, dist, showDrafts: showsDrafts() });
  if (problems.length > 0) {
    console.error(`check-notes-build: ${problems.length} problem(s) in the notes section:`);
    for (const line of problems) console.error(`  ${line}`);
    process.exit(1);
  }
  const files = notesOf(root);
  console.log(`check-notes-build: ok (${files.length} note file(s), ${files.filter((n) => !n.draft).length} live${showsDrafts() ? ", preview: drafts shown" : ""})`);
}
