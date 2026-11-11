// Reads the two front matter values that astro.config.mjs needs for the sitemap (is the page a draft, and the day it
// was last updated) with the same rules as the publish flip (scripts/publish-due.mjs, scheduled publishing): a
// leading UTF-8 byte-order mark, CRLF line ends, only top-level keys (an indented line belongs to another key's
// block), a quoted key, `true`/`True`/`TRUE`, a trailing `# comment`, and for a timestamp its UTC day.
// Plain JS with no Astro imports, so the config and the tests can load it.

const BOMS = ["﻿", "ï»¿"]; // a UTF-8 byte-order mark, as read as utf8 or as latin1

/** The lines of a file's front matter, or null if it has none. */
function frontMatterLines(text) {
  const bom = BOMS.find((b) => text.startsWith(b))?.length ?? 0;
  const fm = text.slice(bom).match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  return fm ? fm[1].split("\n").map((line) => line.replace(/\r$/, "")) : null;
}

/** The raw value of one top-level `key:` line (a trailing comment and the spaces around it left out), or null. */
export function frontMatterValue(text, key) {
  const re = new RegExp(`^(["']?)${key}\\1[ \\t]*:(?=[ \\t]|$)(.*)$`);
  for (const line of frontMatterLines(text) ?? []) {
    const m = line.match(re);
    if (m) return m[2].match(/^[ \t]*(.*?)(?:[ \t]+#.*)?[ \t]*$/)[1];
  }
  return null;
}

/** Does the front matter say `draft: true` (also `True`, `TRUE`)? A `draft:` line the flip couldn't read isn't one. */
export function isDraft(text) {
  return ["true", "True", "TRUE"].includes(frontMatterValue(text, "draft") ?? "");
}

/** The UTC day (YYYY-MM-DD) of a YAML date or timestamp value, as Astro's z.coerce.date() would see it; null if it isn't one. */
export function utcDay(raw) {
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

/** The UTC day of the front matter's `updated:` value, or null. */
export function updatedDay(text) {
  const raw = frontMatterValue(text, "updated");
  return raw === null ? null : utcDay(raw);
}

/**
 * The file text without its top-level `draft:` line. The publish flip changes only that line, so a PDF's source
 * fingerprint (scripts/article-pdfs.mjs) is taken over this text: going live must not make the PDF stale.
 * @param {string} text
 * @returns {string}
 */
export function withoutDraftLine(text) {
  const bom = BOMS.find((b) => text.startsWith(b))?.length ?? 0;
  const fm = text.slice(bom).match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!fm) return text;
  const start = bom + fm[0].indexOf("\n") + 1; // where the front matter body starts
  const body = fm[1];
  const eol = /^---[ \t]*\r\n/.test(text.slice(bom)) ? "\r\n" : "\n";
  const kept = body.split(/\r?\n/).filter((line) => !/^(["']?)draft\1[ \t]*:(?=[ \t]|$)/.test(line));
  return text.slice(0, start) + kept.join(eol) + text.slice(start + body.length);
}
