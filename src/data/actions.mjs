// Calls to action inside an article's body (operator, 2026-11-14: required on every article and use case, on every
// product site; rules in the n-uf-seo skill, "Calls to action in the body"). Each one is a heading tied to the page's
// problem, one plain sentence and one button, put in at build time as plain server HTML: no pop-up, no bar fixed to the screen, nothing
// that opens or moves after the page loads.
//
// The block's text comes from the article's front matter (`actions`, src/content.config.ts), so each one is worded for its
// page and says only what the product's own pages say. This file only decides where each one goes:
//   - after a paragraph, never inside a list, table or code block;
//   - the first as early as the text allows once the opening answer is past (HEAD words), the next about every STEP
//     words (2.5 minutes of reading at 230 words a minute, a jitter seeded by the page so it never changes between
//     builds; on a shorter page the last place that is allowed), at least MIN_GAP words apart, at most one per entry of
//     `actions` and three in all;
//   - never in the last TAIL words, never right before a list, table, code block or figure (a sentence that ends in a
//     colon leads into one), never inside a run of paragraphs that open in bold (a list in disguise);
//   - after a paragraph that names the need (it holds the words of the page's main keyword) when there is one near the
//     mark, else at the end of a section (just before the next "##" heading), else after any paragraph.
// Plain JS with no Astro imports, so scripts/actions.test.mjs can run it. Papyrus articles have no `actions`: untouched.
import { EXT_ARROW_PATH, EXT_ARROW_STROKE, EXT_ARROW_VIEWBOX } from './ext-arrow.mjs';

export const HEAD = 300;
export const TAIL = 250;
export const MIN_GAP = 350;
export const STEP = 575;
export const WINDOW = 160;
export const MAX = 3;
const JITTER = 0.15;

const BLOCK = /<(\/?)(p|ul|ol|table|pre|blockquote|h[1-6]|div|figure)\b[^>]*>/gi;
const words = (html) => (html.replace(/<[^>]+>/g, ' ').match(/[\p{L}\p{N}][\p{L}\p{N}'’_-]*/gu) ?? []).length;
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The top-level blocks of rendered markdown, with the word count up to each block's end and what follows it. */
export function blocks(html) {
  const out = [];
  let depth = 0;
  let start = 0;
  let tag = '';
  let cum = 0;
  for (const m of html.matchAll(BLOCK)) {
    const closing = m[1] === '/';
    const name = m[2].toLowerCase();
    if (!closing) {
      if (depth === 0) {
        start = m.index;
        tag = name;
      }
      depth++;
    } else if (--depth === 0) {
      const end = m.index + m[0].length;
      const text = html.slice(start, end);
      cum += words(text);
      out.push({ end, tag, text, cum, nextTag: '', boldLead: tag === 'p' && /^<p[^>]*>\s*<strong\b/i.test(text) });
    }
  }
  out.forEach((b, i) => {
    b.nextTag = out[i + 1]?.tag ?? '';
    b.prevBold = out[i - 1]?.boldLead ?? false;
    b.nextBold = out[i + 1]?.boldLead ?? false;
  });
  return out;
}

/** A small seeded random number generator: the same page gets the same numbers on every build. */
function rng(seed) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The distinctive words of a main keyword ("react theme switcher component" -> theme, switcher). */
export function needWords(mainKeyword) {
  const generic = new Set(['react', 'component', 'components', 'a', 'an', 'the', 'in', 'for', 'of', 'and', 'with']);
  return mainKeyword
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 2 && !generic.has(w));
}

/** How many of the keyword's words a paragraph holds, as whole words; 0 for anything but a paragraph. */
function score(block, need) {
  if (block.tag !== 'p' || need.length === 0) return 0;
  const plain = block.text.replace(/<[^>]+>/g, ' ').toLowerCase();
  return need.filter((w) => new RegExp(`(^|[^\\p{L}\\p{N}])${w}`, 'u').test(plain)).length;
}

/** The block's html: heading, sentence, one button. `isExternal` and `note` come from src/data/links.ts. */
export function actionHtml(action, n, { isExternal, note }) {
  const id = `cta-${n}`;
  const external = isExternal(action.href);
  const arrow = `<span class="ext-arrow" aria-hidden="true"><svg viewBox="${EXT_ARROW_VIEWBOX}" width="10" height="10" focusable="false"><path d="${EXT_ARROW_PATH}" fill="none" stroke="currentColor" stroke-width="${EXT_ARROW_STROKE}" stroke-linecap="square"></path></svg></span>`;
  const attrs = external ? ' target="_blank" rel="noopener"' : '';
  const tail = external ? `${arrow}<span class="sr-only">${escapeHtml(note)}</span>` : '';
  return (
    `<aside class="kit-cta" aria-labelledby="${id}" data-cta="${n}">` +
    `<h3 class="kit-cta-title" id="${id}">${escapeHtml(action.heading)}</h3>` +
    `<p class="kit-cta-text">${escapeHtml(action.text)}</p>` +
    `<p class="kit-cta-act"><a class="kit-cta-button" href="${escapeHtml(action.href)}"${attrs}>${escapeHtml(action.label)}${tail}</a></p>` +
    `</aside>`
  );
}

/**
 * Where the blocks go: the end offsets in `html` after which each one is inserted, in order. At most `actions.length`
 * (and MAX) places; fewer, down to none, when the text is too short to hold one after HEAD words and before TAIL.
 */
export function places(html, count, { page, mainKeyword }) {
  const bs = blocks(html);
  const total = bs.at(-1)?.cum ?? 0;
  const need = needWords(mainKeyword);
  const rand = rng(page);
  const step = () => STEP * (1 + (rand() * 2 - 1) * JITTER);
  const picks = [];
  let last = -Infinity;
  let target = HEAD;
  while (picks.length < Math.min(count, MAX) && target <= total - TAIL) {
    const near = (b) => Math.abs(b.cum - target);
    // never between a sentence and the list, table, code or figure it introduces, nor inside a run of bold-lead paragraphs
    const leadsIn = (b) =>
      ['ul', 'ol', 'table', 'pre', 'figure'].includes(b.nextTag) ||
      /:\s*(<\/[^>]+>\s*)*$/.test(b.text.replace(/<\/p>\s*$/, '').trimEnd());
    const bold = (b) => b.boldLead && (b.prevBold || b.nextBold);
    const ok = (b) =>
      b.tag === 'p' && b.cum >= HEAD && b.cum <= total - TAIL && b.cum - last >= MIN_GAP && !leadsIn(b) && !bold(b);
    const first = picks.length === 0;
    // the first one: as early as the text allows; the next ones: near the mark
    const within = (b) => (first ? true : near(b) <= WINDOW);
    const anchors = bs
      .filter((b) => ok(b) && within(b) && score(b, need) > 0)
      .sort((x, y) => (first ? x.cum - y.cum : score(y, need) - score(x, need) || near(x) - near(y)));
    const sectionEnds = bs.filter((b) => ok(b) && within(b) && b.nextTag === 'h2').sort((x, y) => (first ? x.cum - y.cum : near(x) - near(y)));
    const any = bs.filter((b) => ok(b) && within(b)).sort((x, y) => (first ? x.cum - y.cum : near(x) - near(y)));
    const pick = anchors[0] ?? sectionEnds[0] ?? any[0];
    if (!pick) {
      target += 100;
      continue;
    }
    picks.push(pick);
    last = pick.cum;
    // about STEP words on, but never past the last place that is allowed: a short page still gets its second one
    target = Math.min(last + step(), total - TAIL);
  }
  return picks.map((b) => b.end);
}

/**
 * The article's rendered html with its calls to action in place.
 * @param {string} html the body, after the live blocks are resolved
 * @param {{ heading: string, text: string, label: string, href: string }[] | undefined} actions
 * @param {{ page: string, mainKeyword: string, isExternal: (href: string) => boolean, note: string }} options
 *   `page` is the page's path (it seeds the jitter)
 */
export function withActions(html, actions, { page, mainKeyword, isExternal, note }) {
  if (!actions || actions.length === 0) return html;
  const at = places(html, actions.length, { page, mainKeyword });
  let out = html;
  // from the last place to the first, so an earlier offset stays right
  for (let i = at.length - 1; i >= 0; i--) {
    out = out.slice(0, at[i]) + '\n' + actionHtml(actions[i], i + 1, { isExternal, note }) + out.slice(at[i]);
  }
  return out;
}
