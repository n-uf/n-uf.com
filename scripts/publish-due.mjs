#!/usr/bin/env node
// Scheduled publishing: go live by flipping `draft: true` to `draft: false`.
//
// How it works: a finished page is merged to main with `draft: true` and its go-live date in `published`
// (YYYY-MM-DD, UTC). Production builds don't render drafts: that is the content layer's job (src/content.config.ts
// and the draft rule `isLive` in src/data/articles.ts, from the branch fl/papyrus-articles-layer), and this script
// ships together with it; on its own, main has no draft handling. This script, run daily at 00:10 UTC by
// .github/workflows/publish.yml, looks at every .md directly inside every content collection (each folder directly
// under src/content, any new one without a change here) and, for each one whose front matter has
// `draft: true` and a `published` date on or before today (UTC), changes that one line to `draft: false` and nothing
// else in the file. It prints one `<collection>/<slug>` per line (the folder under src/content and the file name
// without .md, e.g. `papyrus/html-to-pdf`).
// The workflow commits the change as `publish: <collection>/<slug>[, <collection>/<slug>]` and pushes to main; Vercel
// then deploys it. Ported from n-uf/cl_audit_home (scripts/publish-due.mjs), which has a fixed list of sections.
//
// Names: a collection folder is lowercase letters, digits and dashes, a page's file name is <slug>.md with a slug of
// letters, digits, `_` and `-` (scripts/check-publish-patch.py accepts nothing else). A due draft with another name is
// not flipped: it is an error (exit 3, below), so it can't silently stay a draft.
//
// What it reads: `draft: true|True|TRUE` (what Astro's YAML takes as true; the flip is always written as `false`),
// `published:` as a date or, for a timestamp, its UTC day, a leading UTF-8 byte-order mark, CRLF line ends, and only
// top-level keys (an indented `draft:` inside another key's block is not looked at).
// Exit code: 0 whether or not anything is due; 3 if some file has a `draft:` line, or a draft's `published:` line, it
// can't interpret, or is a due draft whose folder or file name breaks the rules above (the others are still processed
// and listed; that file is left untouched and named on stderr);
// 2 for any other error the script catches. Anything else (Node's own 1 when this file fails to load, a signal) is a
// crash too: only 0 and 3 mean the script ran through, which is what publish.yml relies on.
//
//   node scripts/publish-due.mjs [--dry-run] [--today YYYY-MM-DD] [--root <dir>]
//     --dry-run  list the due slugs, change nothing
//     --today    the date to compare with (default: today in UTC); for tests
//     --root     the folder that holds src/content/... (default: the repo root)
//
// To undo a publish: revert the publish commit, or set `draft: true` again in the page's front matter (a page
// whose date has passed flips back on the next run, so also move `published` to a future date to hold it).
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const CONTENT = "src/content";
const COLLECTION_RE = /^[a-z0-9][a-z0-9-]*$/;
const SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

/** The content collections: the real folders (not symlinks) directly under src/content, sorted. */
function collections(root) {
  const full = join(root, CONTENT);
  if (!existsSync(full)) return [];
  return readdirSync(full, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function parseArgs(argv) {
  const opts = { dryRun: false, today: new Date().toISOString().slice(0, 10), root: resolve(dirname(fileURLToPath(import.meta.url)), "..") };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--today") opts.today = argv[++i] ?? "";
    else if (a === "--root") opts.root = resolve(argv[++i] ?? "");
    else throw new Error(`unknown option ${a}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(opts.today)) throw new Error(`--today must be YYYY-MM-DD, got "${opts.today}"`);
  return opts;
}

/** A `draft:` or `published:` line (or the front matter) that this script can't interpret; the message names no file. */
export class FrontMatterError extends Error {}

const BOMS = ["﻿", "ï»¿"]; // a UTF-8 byte-order mark, as read as utf8 or as latin1

// Astro parses front matter as YAML 1.2 core schema, where only true/True/TRUE and false/False/FALSE are booleans
// (`yes`, `on`, `"true"` are strings, which z.boolean() refuses, so such a page fails the build anyway).
const BOOLEANS = new Map([["true", true], ["True", true], ["TRUE", true], ["false", false], ["False", false], ["FALSE", false]]);

/**
 * The value of one top-level `key:` line of the front matter: { start, end, raw, line } (offsets in the file, a
 * trailing comment and the spaces around the value left out), or null if the key isn't there. Indented lines belong
 * to some other key's block and are never looked at. More than one such line is an error, as it is for YAML.
 */
function findKey(lines, key) {
  const re = new RegExp(`^(["']?)${key}\\1[ \\t]*:(?=[ \\t]|$)(.*)$`);
  let found = null;
  for (const { text, offset } of lines) {
    const m = text.match(re);
    if (!m) continue;
    if (found) throw new FrontMatterError(`the front matter has more than one \`${key}:\` line`);
    const rest = m[2];
    const v = rest.match(/^([ \t]*)(.*?)(?:[ \t]+#.*)?[ \t]*$/);
    const start = text.length - rest.length + v[1].length;
    found = { start: offset + start, end: offset + start + v[2].length, raw: v[2], line: text };
  }
  return found;
}

/** The UTC day (YYYY-MM-DD) of a YAML date or timestamp value, as Astro's z.coerce.date() would see it; null if it isn't one. */
function utcDay(raw) {
  const m = raw.match(/^(["']?)(\d{4})-(\d{2})-(\d{2})(?:(?:[Tt]|[ \t]+)(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?[ \t]*(Z|z|[+-]\d{1,2}(?::?\d{2})?)?)?\1$/);
  if (!m) return null;
  const [, , y, mo, d, hh, mi, ss, zone] = m;
  if (hh === undefined) {
    const day = `${y}-${mo}-${d}`;
    const date = new Date(`${day}T00:00:00Z`);
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== day ? null : day;
  }
  let tz = "Z"; // a timestamp with no zone is UTC in YAML
  if (zone && !/^[Zz]$/.test(zone)) {
    const z = zone.match(/^([+-])(\d{1,2}):?(\d{2})?$/);
    tz = `${z[1]}${z[2].padStart(2, "0")}:${z[3] ?? "00"}`;
  }
  const date = new Date(`${y}-${mo}-${d}T${hh.padStart(2, "0")}:${mi}:${ss ?? "00"}${tz}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

/**
 * The new text of a file whose draft is due, or null if it isn't a due draft. Only the value of the `draft:` line
 * changes (to `false`, whatever its casing was); a trailing comment, the line end and everything else stay.
 * Throws FrontMatterError when a `draft:` line, or the `published:` line of a draft, can't be interpreted.
 */
export function flip(text, today) {
  const bom = BOMS.find((b) => text.startsWith(b))?.length ?? 0;
  const fm = text.slice(bom).match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!fm) return null;
  const base = bom + fm[0].indexOf("\n") + 1; // where the front matter body starts in the file
  const lines = [];
  for (let offset = 0; ;) {
    const nl = fm[1].indexOf("\n", offset);
    const raw = nl < 0 ? fm[1].slice(offset) : fm[1].slice(offset, nl);
    lines.push({ text: raw.replace(/\r$/, ""), offset: base + offset });
    if (nl < 0) break;
    offset = nl + 1;
  }

  const draft = findKey(lines, "draft");
  if (!draft) return null; // no draft line: a live page
  if (!BOOLEANS.has(draft.raw)) {
    throw new FrontMatterError(`can't read \`${draft.line.trim()}\`: draft must be true or false`);
  }
  if (!BOOLEANS.get(draft.raw)) return null;

  const published = findKey(lines, "published");
  if (!published) throw new FrontMatterError("a draft with no `published:` line, so its go-live date is unknown");
  const day = utcDay(published.raw);
  if (!day) throw new FrontMatterError(`can't read \`${published.line.trim()}\`: published must be a date like 2026-11-01 (a timestamp is read as its UTC day)`);
  if (day > today) return null;
  return text.slice(0, draft.start) + "false" + text.slice(draft.end);
}

function main() {
  const { dryRun, today, root } = parseArgs(process.argv.slice(2));
  const due = [], errors = [];
  for (const collection of collections(root)) {
    const dir = `${CONTENT}/${collection}`;
    const full = join(root, dir);
    // regular .md files only: a symlink or a folder named *.md is not a page the guard would accept
    const names = readdirSync(full, { withFileTypes: true }).filter((d) => d.isFile() && d.name.endsWith(".md")).map((d) => d.name).sort();
    for (const name of names) {
      const file = join(full, name);
      let next;
      try {
        // latin1 keeps every byte as it is, so the rest of the file is written back unchanged
        next = flip(readFileSync(file, "latin1"), today);
      } catch (e) {
        if (!(e instanceof FrontMatterError)) throw e;
        errors.push(`${dir}/${name}: ${e.message}`);
        continue;
      }
      if (next === null) continue;
      const slug = name.slice(0, -3);
      if (!COLLECTION_RE.test(collection) || !SLUG_RE.test(slug)) {
        errors.push(`${dir}/${name}: a due draft whose folder or file name the publish guard refuses (collection: lowercase letters, digits, dashes; slug: letters, digits, _ and -); rename it`);
        continue;
      }
      if (!dryRun) writeFileSync(file, next, "latin1");
      due.push(`${collection}/${slug}`);
    }
  }
  for (const page of due) console.log(page);
  if (errors.length > 0) {
    for (const line of errors) console.error(`publish-due: ${line}`);
    console.error(`publish-due: ${errors.length} file(s) skipped because their front matter can't be read or their name is refused; fix them, they stay drafts until then`);
    process.exitCode = 3; // after the others were processed; not 1, which Node itself uses when the script fails to load
  }
}

// run only as a script, so the tests can import flip()
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (e) { console.error(`publish-due: ${e.message}`); process.exit(2); }
}
