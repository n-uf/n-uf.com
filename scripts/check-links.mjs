#!/usr/bin/env node
// Fails the build when a built page links to an internal address that has no built file.
// Why: a live page must never link to a draft, and production builds render no page for a draft, so such a link
// shows up here as a target without a file. Runs after `astro build` (see "build" in package.json).
//
//   node scripts/check-links.mjs [dist-dir] [--host <host>]     (default: dist, and the host of `siteUrl`)
//
// Walks every .html file in the folder, collects every internal href (starting with "/", not "//", or an absolute link
// to this site's own host, https://n-uf.com/..., which counts as the same path; "#..." and links to other
// hosts are ignored; ?query and #hash are cut off) and checks that a file exists for it:
// /x/ -> /x/index.html, /x -> /x.html or /x/index.html, /file.ext -> that file.
// A link that resolves outside the folder (an encoded "..", as in /..%2Fsecret.txt) is refused, not followed.
// The site's host is read from `siteUrl` in src/data/projects.ts (the one `astro.config.mjs` uses), so it can't drift.
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, resolve, relative, extname, sep, posix, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const hostAt = args.indexOf("--host");
const positional = args.filter((a, i) => !a.startsWith("--") && (hostAt < 0 || i !== hostAt + 1));

/** The host of `siteUrl` in src/data/projects.ts; stops the script if it can't be read. */
function siteHost() {
  const file = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "projects.ts");
  const m = readFileSync(file, "utf8").match(/export const siteUrl(?::\s*string)?\s*=\s*["']https?:\/\/([^"'/]+)/);
  if (!m) {
    console.error(`check-links: no \`siteUrl\` found in ${file}; pass --host <host>`);
    process.exit(1);
  }
  return m[1];
}
const SITE_HOST = hostAt >= 0 ? (args[hostAt + 1] ?? "") : siteHost();
if (!SITE_HOST) {
  console.error("check-links: --host needs a host name");
  process.exit(1);
}
const ownHost = new RegExp(`^(?:https?:)?//${SITE_HOST.replace(/\./g, "\\.")}(?=[/?#]|$)`, "i");

/** The site path of an internal href ("/x/", "/x?a#b"), or null if the href is an external link or not a path. */
function internalPath(href) {
  const own = href.match(ownHost);
  if (own) {
    const rest = href.slice(own[0].length);
    return rest.startsWith("/") ? rest : `/${rest}`; // "https://host" and "https://host?x" are the home page
  }
  return href.startsWith("/") && !href.startsWith("//") ? href : null;
}

const dist = resolve(positional[0] ?? "dist");
if (!existsSync(dist)) {
  console.error(`check-links: ${dist} does not exist; run astro build first`);
  process.exit(1);
}

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* htmlFiles(p);
    else if (name.endsWith(".html")) yield p;
  }
}

/** "ok", "missing" (no built file), or "outside" (the link resolves outside the folder, so nothing is looked up). */
function check(href) {
  // The URL parser resolves "." and ".." segments and drops ?query and #hash; an encoded "..%2F" survives it, so
  // decode, then look again: any ".." left is an attempt to climb out of the folder.
  let path = new URL(href, `https://${SITE_HOST}`).pathname;
  try { path = decodeURIComponent(path); } catch { /* keep the encoded path: it is looked up as written */ }
  if (path.split("/").includes("..")) return "outside";
  path = posix.normalize(path);
  const file = resolve(dist, `.${path}`);
  if (file !== dist && !file.startsWith(dist + sep)) return "outside";
  if (path.endsWith("/")) return existsSync(join(file, "index.html")) ? "ok" : "missing";
  if (extname(path)) return existsSync(file) ? "ok" : "missing";
  return existsSync(`${file}.html`) || existsSync(join(file, "index.html")) ? "ok" : "missing";
}

const missing = [];
let pages = 0, checked = 0;
for (const file of htmlFiles(dist)) {
  pages++;
  const page = "/" + relative(dist, file).replace(/index\.html$/, "").replace(/\\/g, "/");
  const seen = new Set();
  for (const m of readFileSync(file, "utf8").matchAll(/<a\b[^>]*?\shref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const href = internalPath((m[1] ?? m[2]).replace(/&amp;/g, "&").trim());
    if (href === null || seen.has(href)) continue;
    seen.add(href);
    checked++;
    const result = check(href);
    if (result !== "ok") missing.push(`${page} -> ${href}${result === "outside" ? " (resolves outside the build folder)" : ""}`);
  }
}

if (missing.length > 0) {
  console.error(`check-links: ${missing.length} internal link(s) point to no built page (a live page linking to a draft?):`);
  for (const line of missing) console.error(`  ${line}`);
  process.exit(1);
}
console.log(`check-links: ok (${pages} pages, ${checked} internal links)`);
