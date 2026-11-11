// Links into a future page: in a markdown body, {{live:/path/}}…{{/live}} wraps a sentence that should show only
// once /path/ is built. So a link line can merge together with a draft page and appear on the day the draft goes
// live (scripts/publish-due.mjs), with no second commit. In production a draft is not built, so its block is removed;
// in dev and Vercel previews drafts are built, so the block stays.
//
// This file is plain JS with no Astro imports so that scripts/live-blocks.test.mjs can run it; src/data/live.ts
// adds the real "is this path built" lookup and is what the pages call.
//
// Build errors (each names `where`, the file, and the reason): a target that is no page at all; a nested block;
// a stray {{live: or {{/live}}; a block that spans paragraphs (or any other block element); a block in a heading
// (it would leave an empty heading, and the table of contents would show its raw markers).

const MARK = /\{\{live:([^{}]*)\}\}|\{\{\/live\}\}/g;
const BLOCK_TAG = /<\/?(?:p|ul|ol|li|h[1-6]|blockquote|pre|table|figure|div|hr)\b/i;
// A site path in the canonical form of this site: no trailing slash, "/" for the home page.
const SITE_PATH = /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/;

/** The target of a {{live:…}} marker in canonical form: trimmed, and "/papyrus/x/" means "/papyrus/x". */
export function normalizeLivePath(raw) {
  const path = raw.trim();
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

/**
 * Every target of a {{live:…}} marker in the rendered HTML, in canonical form (not checked to be a site path).
 * @param {string} html
 * @returns {Set<string>}
 */
export function liveTargets(html) {
  const targets = new Set();
  for (const m of html.matchAll(MARK)) if (m[1] !== undefined) targets.add(normalizeLivePath(m[1]));
  return targets;
}

/**
 * The HTML with each {{live:/path/}}…{{/live}} block resolved.
 * @param {string} html the rendered markdown body
 * @param {(path: string) => "built" | "unbuilt" | "none"} status "built": a page exists in this build (live, or a
 *   draft shown in dev/preview); "unbuilt": a page whose draft is hidden in this build; "none": no such page at all
 * @param {string} where the file name, for error messages
 * @param {(path: string) => string | undefined} [liveFrom] the day (YYYY-MM-DD) the target goes live, if it has one:
 *   a kept block is then wrapped in a marker that `dropLateLiveBlocks` can take out again (the print layout)
 * @returns {string}
 */
export function applyLiveBlocks(html, status, where, liveFrom = () => undefined) {
  const fail = (reason) => { throw new Error(`${where}: ${reason}`); };
  let out = "", pos = 0, open = null, removed = false;

  for (const m of html.matchAll(MARK)) {
    if (m[0] !== "{{/live}}") {
      if (open) fail(`nested live block: {{live:${m[1]}}} starts inside the one for ${open.path}`);
      const path = normalizeLivePath(m[1]);
      if (!SITE_PATH.test(path)) fail(`{{live:${m[1]}}} is not a site path like /papyrus/some-article`);
      const before = html.slice(0, m.index);
      const lastOpenH = Math.max(...[...before.matchAll(/<h[1-6]\b/gi)].map((x) => x.index), -1);
      const lastCloseH = Math.max(...[...before.matchAll(/<\/h[1-6]>/gi)].map((x) => x.index), -1);
      if (lastOpenH > lastCloseH) fail(`the live block for ${path} is inside a heading: put it in a paragraph or list item`);
      open = { path, start: m.index, end: m.index + m[0].length };
      continue;
    }
    if (!open) fail("stray {{/live}} with no {{live:...}} before it");
    const inner = html.slice(open.end, m.index);
    const tag = inner.match(BLOCK_TAG);
    if (tag) fail(`the live block for ${open.path} spans more than one paragraph (it contains ${tag[0]}>): keep it inside one sentence`);
    const s = status(open.path);
    if (s === "none") fail(`the live block target ${open.path} is no page: not a use case, an article or a fixed page of this site`);
    out += html.slice(pos, open.start);
    pos = m.index + m[0].length;
    if (s === "built") {
      const from = liveFrom(open.path);
      out += from ? `<span data-live-from="${from}">${inner}</span>${LIVE_FROM_END}` : inner;
    } else {
      removed = true;
      ({ out, pos } = closeGap(html, pos, out));
    }
    open = null;
  }
  if (open) fail(`{{live:${open.path}}} is never closed with {{/live}}`);
  out += html.slice(pos);
  if (/\{\{\s*\/?\s*live/i.test(out)) fail("stray {{live: or {{/live}} (not a complete {{live:/path/}}…{{/live}} pair)");
  return removed ? dropEmpty(out) : out;
}

const OPENING_BLOCK_TAG = /<(?:p|li|ul|ol|h[1-6]|td|th|div|blockquote)(?:\s[^>]*)?>$/i;

/**
 * What is left around a block that was just removed (`out` is the HTML before it, `pos` where the HTML after it starts):
 * the space after the block goes with it, and the space before it too when a closing tag or the end follows. When text
 * follows and no space came before the block ("one.{{live:…}} two.{{/live}} Three."), one space is kept between the
 * two sentences, so they don't run together.
 * @param {string} html
 * @param {number} pos
 * @param {string} out
 * @returns {{ out: string, pos: number }}
 */
function closeGap(html, pos, out) {
  const start = pos;
  while (pos < html.length && /\s/.test(html[pos])) pos++;
  if (pos >= html.length || html.startsWith("</", pos)) return { out: out.trimEnd(), pos };
  if (pos > start && out !== "" && !/\s$/.test(out) && !OPENING_BLOCK_TAG.test(out)) out += " ";
  return { out, pos };
}

/**
 * A paragraph or list item that was only a removed block is left empty: drop it, and then a list item (a loose list
 * wraps items in <p>) or a whole list that this leaves empty, until nothing more changes.
 * @param {string} html
 * @returns {string}
 */
function dropEmpty(html) {
  let out = html;
  for (let prev = ""; prev !== out; ) {
    prev = out;
    out = out.replace(/<(p|li|ul|ol)(?:\s[^>]*)?>\s*<\/\1>\n?/g, "");
  }
  return out;
}

const LIVE_FROM_END = "<!--/live-from-->";
const LIVE_FROM = /<span data-live-from="(\d{4}-\d{2}-\d{2})">([\s\S]*?)<\/span><!--\/live-from-->/g;

/**
 * The print layout of an article (a PDF outlives the day it is printed): a block stays only when its target goes live on
 * or before the day the article does. A preview build, where the PDF is printed, shows every block, so this puts back
 * what the article's own production page had on its go-live day. Blocks it keeps lose their marker; the ones it drops
 * go the way a block does in a production build (the space around them, then an empty paragraph or list).
 * @param {string} html the article's HTML as `applyLiveBlocks` made it (with its liveFrom markers)
 * @param {string} published the day the article goes live (YYYY-MM-DD)
 * @returns {string}
 */
export function dropLateLiveBlocks(html, published) {
  let out = "", pos = 0, removed = false;
  for (const m of html.matchAll(LIVE_FROM)) {
    out += html.slice(pos, m.index);
    pos = m.index + m[0].length;
    if (m[1] <= published) {
      out += m[2];
      continue;
    }
    removed = true;
    ({ out, pos } = closeGap(html, pos, out));
  }
  out += html.slice(pos);
  return removed ? dropEmpty(out) : out;
}
