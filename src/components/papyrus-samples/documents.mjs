// @ts-check
/**
 * The two sample documents of the /papyrus page, written once.
 *
 * - The page (PapyrusSpecimens.astro) shows their sheets, scaled down.
 * - scripts/papyrus-samples.mjs writes them as standalone HTML files under
 *   public/papyrus-samples/, and `papyrus pdf` prints those files to the PDFs.
 *
 * Both take the same page markup (`doc.pages`) and the same paper styling
 * (`paperCss`), so the page and the PDFs cannot drift apart. The sheets follow
 * the papyrus page contract: each page is an element with the class `pdf-page`,
 * sized by `sheetCss()` from @n-uf/papyrus. The text comes from the papyrus
 * READMEs and CHANGELOG and from the /papyrus page itself.
 */

import {
  CONTAINER_CLASS,
  MAIN_CONTENT_CLASS,
  PAGE_CLASS,
  PAGE_COUNT_ATTR,
  SHEETS,
  numberToc,
  sheetCss,
} from '@n-uf/papyrus';

export const SAMPLES_DIR = 'papyrus-samples';
export const PAPYRUS_VERSION = '26.11.2';

/** The paper look, shared with the papyrus articles. */
const PAPER = {
  paper: '#fbfaf6',
  ink: '#16161a',
  copy: '#34343b',
  muted: '#6e6e76',
  faint: '#9a9aa2',
  tint: '#f0eee7',
};

const SANS = '"Geist Variable", "Geist", ui-sans-serif, system-ui, sans-serif';
const MONO = '"Geist Mono Variable", "Geist Mono", ui-monospace, monospace';

/**
 * Styling of the paper itself, scoped under `.sample` so it cannot leak into
 * a page that embeds a sheet. Every element is styled explicitly: the site
 * resets them with Tailwind, the standalone files have no reset at all.
 */
export const paperCss = `
.sample {
  --p-paper: ${PAPER.paper};
  --p-ink: ${PAPER.ink};
  --p-copy: ${PAPER.copy};
  --p-muted: ${PAPER.muted};
  --p-faint: ${PAPER.faint};
  --p-tint: ${PAPER.tint};
  --p-rule: rgb(22 22 26 / 0.16);
}
.sample .${PAGE_CLASS} {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: 72px 76px 52px;
  overflow: hidden;
  background: var(--p-paper);
  color: var(--p-copy);
  font-family: ${SANS};
  font-size: 13.5px;
  font-weight: 400;
  line-height: 1.55;
  text-align: left;
  letter-spacing: normal;
}
.sample .${PAGE_CLASS} *,
.sample .${PAGE_CLASS} *::before,
.sample .${PAGE_CLASS} *::after {
  box-sizing: border-box;
}
:where(.sample .${PAGE_CLASS}) :where(h1, h2, h3, h4, p, ul, ol, li, pre, table) {
  margin: 0;
  padding: 0;
  list-style: none;
}
:where(.sample .${PAGE_CLASS}) :where(h1, h2, h3, h4) {
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
}
.sample .${MAIN_CONTENT_CLASS} {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}
.sample .eyebrow {
  color: var(--p-muted);
  font-family: ${MONO};
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.sample .cover-title {
  margin-top: 28px;
  color: var(--p-ink);
  font-size: 72px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.035em;
}
.sample .cover-sub {
  max-width: 470px;
  margin-top: 20px;
  color: var(--p-ink);
  font-size: 22px;
  line-height: 1.35;
  letter-spacing: -0.01em;
}
.sample .cover-text {
  max-width: 470px;
  margin-top: 22px;
}
.sample .callout {
  margin-top: 28px;
  padding: 14px 16px;
  border-left: 3px solid var(--p-ink);
  background: var(--p-tint);
  color: var(--p-copy);
}
.sample .callout strong {
  color: var(--p-ink);
  font-weight: 600;
}
.sample .label {
  margin-top: 40px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--p-ink);
  color: var(--p-ink);
  font-family: ${MONO};
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.sample .toc li {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 9px 0;
  color: var(--p-ink);
  font-size: 15px;
}
.sample .toc .n {
  flex: none;
  width: 28px;
  color: var(--p-muted);
  font-family: ${MONO};
  font-size: 13px;
}
.sample .toc .t {
  flex: none;
}
.sample .toc .leader {
  flex: 1 1 auto;
  min-width: 12px;
  border-bottom: 1px dotted var(--p-faint);
  transform: translateY(-3px);
}
.sample .toc .pg {
  flex: none;
  color: var(--p-muted);
  font-family: ${MONO};
  font-size: 13px;
}
.sample .running {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--p-rule);
  color: var(--p-faint);
  font-family: ${MONO};
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.sample .sec {
  margin-top: 26px;
}
.sample .sec h2,
.sample .sec h3,
.sample .sec h4 {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 8px;
  color: var(--p-ink);
  font-size: 19px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.015em;
}
.sample .sec .no {
  flex: none;
  min-width: 28px;
  color: var(--p-muted);
  font-family: ${MONO};
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0;
}
.sample .sec p + p,
.sample .sec p + table,
.sample .sec p + pre,
.sample .sec table + p,
.sample .sec pre + p {
  margin-top: 10px;
}
.sample code {
  color: var(--p-ink);
  font-family: ${MONO};
  font-size: 0.9em;
}
.sample pre {
  padding: 10px 14px;
  overflow: hidden;
  background: var(--p-tint);
  color: var(--p-ink);
  font-family: ${MONO};
  font-size: 11.5px;
  line-height: 1.6;
  white-space: pre;
}
.sample pre code {
  font-size: inherit;
}
.sample table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  line-height: 1.45;
}
.sample th,
.sample td {
  padding: 7px 10px;
  border-bottom: 1px solid var(--p-rule);
  text-align: left;
  vertical-align: top;
}
.sample td:first-child {
  white-space: nowrap;
}
.sample th {
  background: var(--p-tint);
  color: var(--p-muted);
  font-family: ${MONO};
  font-size: 10.5px;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.sample strong {
  color: var(--p-ink);
  font-weight: 600;
}
.sample .pfoot {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--p-rule);
  color: var(--p-faint);
  font-family: ${MONO};
  font-size: 10.5px;
  letter-spacing: 0.04em;
}
.sample .doc-title {
  margin-top: 20px;
  color: var(--p-ink);
  font-size: 46px;
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
}
.sample .doc-sub {
  margin-top: 10px;
  color: var(--p-muted);
  font-family: ${MONO};
  font-size: 15px;
}
.sample .release {
  margin-top: 30px;
  padding-top: 14px;
  border-top: 1px solid var(--p-ink);
}
.sample .release h2,
.sample .release h3,
.sample .release h4 {
  margin-bottom: 8px;
  color: var(--p-ink);
  font-family: ${MONO};
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.01em;
}
.sample .release li {
  position: relative;
  padding-left: 18px;
}
.sample .release li + li {
  margin-top: 8px;
}
.sample .release li::before {
  content: '';
  position: absolute;
  top: 0.62em;
  left: 2px;
  width: 6px;
  height: 1px;
  background: var(--p-ink);
}
`;

/** Standalone files only: fonts, and a viewer that fits the sheet to a narrow screen. */
const standaloneCss = `
@font-face {
  font-family: "Geist Variable";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("fonts/geist-latin-wght-normal.woff2") format("woff2-variations");
}
@font-face {
  font-family: "Geist Mono Variable";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("fonts/geist-mono-latin-wght-normal.woff2") format("woff2-variations");
}
@media screen {
  body { margin: 0; }
}
`;

/**
 * The page rule of sheetCss()'s screen block (the sheet's size), prefixed with
 * a scope. sheetCss() also emits @page, @media print and canvas rules that
 * reshape html and body; those belong to a document of their own, so they are
 * left out of the n-uf.com page, where they would break its printing.
 *
 * @param {typeof SHEETS.A4} sheet
 * @param {string} scope
 */
export function scopedSheetCss(sheet, scope) {
  const css = sheetCss(sheet);
  const start = css.indexOf('@media screen');
  const open = start < 0 ? -1 : css.indexOf('{', start);
  if (open < 0) throw new Error('sheetCss() has no @media screen block any more');
  let depth = 0;
  let end = open;
  for (; end < css.length; end++) {
    if (css[end] === '{') depth++;
    if (css[end] === '}' && --depth === 0) break;
  }
  const inner = css.slice(open + 1, end);
  for (const [, selector, body] of inner.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (selector.trim() === `.${PAGE_CLASS}`) return `${scope} .${PAGE_CLASS} { ${body.trim()} }`;
  }
  throw new Error(`sheetCss() has no .${PAGE_CLASS} rule in its screen block any more`);
}

/**
 * One page element of the contract.
 *
 * @param {{ docId: string, index: number, count: number, label: string, body: string, foot: [string, string] }} p
 */
function page({ docId, index, count, label, body, foot }) {
  return (
    `<section class="${PAGE_CLASS}" id="${docId}-page-${index + 1}" ${PAGE_COUNT_ATTR}="${count}" aria-label="${label}">` +
    `<div class="${MAIN_CONTENT_CLASS}">${body}</div>` +
    `<div class="pfoot"><span>${foot[0]}</span><span>${foot[1]}</span></div>` +
    `</section>`
  );
}

/**
 * Build both documents. `h` is the heading level of a document title:
 * 1 in a standalone file, 3 on the /papyrus page (under its own H1 and H2).
 *
 * @param {number} h
 */
function buildDocs(h) {
  const hTitle = `h${h}`;
  const hSec = `h${h + 1}`;

  // --- A: the fact sheet, A4, two pages ----------------------------------
  const factToc = [
    { id: 'what', title: 'What it is', page: 2 },
    { id: 'packages', title: 'Two packages, one version', page: 2 },
    { id: 'contract', title: 'One element, one sheet, one page', page: 2 },
    { id: 'check', title: 'The PDF check', page: 2 },
    { id: 'versions', title: 'Versions and licence', page: 2, isAppendix: true },
  ];
  const num = numberToc(factToc);
  const n = (/** @type {string} */ id) => num.get(id) ?? '';

  const tocRows = factToc
    .map(
      (e) =>
        `<li><span class="n">${n(e.id)}</span><span class="t">${e.title}</span>` +
        `<span class="leader" aria-hidden="true"></span><span class="pg">${e.page}</span></li>`,
    )
    .join('');

  const factPage1 = page({
    docId: 'fact-sheet',
    index: 0,
    count: 2,
    label: 'papyrus fact sheet, page 1 of 2',
    foot: ['papyrus fact sheet', '1 / 2'],
    body:
      `<p class="eyebrow">Fact sheet · @n-uf/papyrus ${PAPYRUS_VERSION}</p>` +
      `<${hTitle} class="cover-title">papyrus</${hTitle}>` +
      `<p class="cover-sub">Documents in HTML, printed to PDF.</p>` +
      `<p class="cover-text">papyrus is a documents engine. You write a document as HTML or React pages. ` +
      `On screen each page is a sheet of A4 or US Letter paper, and the same pages print to a PDF.</p>` +
      `<p class="callout"><strong>Young and still changing.</strong> Versions are dates (YY.M.R), not semantic versions, ` +
      `so any release may break things. Pin an exact version and read the changelog before you upgrade.</p>` +
      `<p class="label">Contents</p>` +
      `<ol class="toc">${tocRows}</ol>` +
      `<p class="cover-text" style="margin-top:36px;color:var(--p-muted)">This sheet is itself a papyrus document: ` +
      `each page is an element with the class <code>pdf-page</code>, and its PDF was printed by <code>papyrus pdf</code> ` +
      `after the page count was checked.</p>`,
  });

  const factPage2 = page({
    docId: 'fact-sheet',
    index: 1,
    count: 2,
    label: 'papyrus fact sheet, page 2 of 2',
    foot: ['papyrus fact sheet', '2 / 2'],
    body:
      `<p class="running"><span>papyrus</span><span>n-uf.com/papyrus</span></p>` +
      `<div class="sec" style="margin-top:30px"><${hSec}><span class="no">${n('what')}</span>What it is</${hSec}>` +
      `<p>papyrus is a documents engine. You write a document as HTML or React pages. On screen each page is a sheet ` +
      `of A4 or US Letter paper, and the same pages print to a PDF. A report or a resume stays one source for the web and for print.</p></div>` +
      `<div class="sec"><${hSec}><span class="no">${n('packages')}</span>Two packages, one version</${hSec}>` +
      `<table><thead><tr><th>Package</th><th>What it is</th><th>Ships</th></tr></thead><tbody>` +
      `<tr><td><strong>@n-uf/papyrus</strong></td><td>The engine, with no framework: the page contract, sheet sizes and print CSS, the document registry and the PDF exporter.</td><td>Plain ESM JavaScript with type declarations</td></tr>` +
      `<tr><td><strong>@n-uf/papyrus-react</strong></td><td>React components on top of the engine: page and content blocks, a document registry typed for React, and print styles.</td><td>TypeScript source</td></tr>` +
      `</tbody></table>` +
      `<p>Both carry no brand, copy or content of their own; your documents supply those. They are released together at one version.</p></div>` +
      `<div class="sec"><${hSec}><span class="no">${n('contract')}</span>One element, one sheet, one page</${hSec}>` +
      `<p>Every element with the class <code>pdf-page</code> is one sheet on screen and one page in the PDF. ` +
      `<code>sheetCss()</code> sizes it to A4 (210 × 297 mm) or Letter (8.5 × 11 in) and keeps one per printed page.</p>` +
      `<pre><code>import { SHEETS, sheetCss } from "@n-uf/papyrus";\n\nconst css = sheetCss(SHEETS.LETTER);  // US Letter sheets</code></pre></div>` +
      `<div class="sec"><${hSec}><span class="no">${n('check')}</span>The PDF check</${hSec}>` +
      `<p>The <code>papyrus</code> command prints every document in a config file through headless Chromium. ` +
      `It checks every PDF before writing it: the number of pages in the HTML, the PDF's own page count and the count you expect must agree. ` +
      `If they don't, for example because a page overflowed onto an extra sheet, the export stops instead of writing the file.</p>` +
      `<pre><code>papyrus pdf --config papyrus.config.json</code></pre></div>` +
      `<div class="sec"><${hSec}><span class="no">${n('versions')}</span>Versions and licence</${hSec}>` +
      `<p>Calendar versions, <code>YY.M.R</code>: <code>26.11.0</code> is the first release of November 2026. ` +
      `Licence: PolyForm Perimeter 1.0.1.</p></div>`,
  });

  // --- B: the release notes, US Letter, one page -------------------------
  const notes = page({
    docId: 'release-notes',
    index: 0,
    count: 1,
    label: 'papyrus release notes, page 1 of 1',
    foot: ['@n-uf/papyrus release notes', '1 / 1'],
    body:
      `<p class="eyebrow">@n-uf/papyrus</p>` +
      `<${hTitle} class="doc-title">Release notes</${hTitle}>` +
      `<p class="doc-sub">26.11.0 to 26.11.2</p>` +
      `<p class="callout"><strong>Same code throughout.</strong> All three releases ship the same code as 0.4.1; what changed is the versioning, the licence and where the package is released from. ` +
      `Pin an exact version and read the changelog before you upgrade.</p>` +
      `<div class="release"><${hSec}>26.11.2</${hSec}><ul>` +
      `<li>The package's homepage is now its overview page, n-uf.com/papyrus. Same code as 26.11.1.</li></ul></div>` +
      `<div class="release"><${hSec}>26.11.1</${hSec}><ul>` +
      `<li>Now released from its own repo, n-uf/papyrus, to npmjs (with provenance) as well as GitHub Packages. Same code as 26.11.0; the package now ships this CHANGELOG.</li></ul></div>` +
      `<div class="release"><${hSec}>26.11.0</${hSec}><ul>` +
      `<li>Calendar versions (<code>YY.M.R</code>) from now on, like hypr-tiling, doodl and debugsy; <code>@n-uf/papyrus-react</code> shares the version. ` +
      `Same code as 0.4.1: <code>^0.4.x</code> ranges do not pick this up, so move them to <code>^26.11.0</code>.</li>` +
      `<li>License: PolyForm Perimeter 1.0.1 (was <code>UNLICENSED</code>); see <code>LICENSE</code>.</li></ul></div>` +
      `<p class="cover-text" style="margin-top:34px;color:var(--p-muted)">Source: <code>packages/papyrus/CHANGELOG.md</code> in n-uf/papyrus.</p>`,
  });

  return [
    {
      id: 'fact-sheet',
      name: 'papyrus fact sheet',
      title: 'papyrus fact sheet',
      sheet: SHEETS.A4,
      sheetKey: 'a4',
      sizeLabel: 'A4 · 210 × 297 mm',
      pages: [factPage1, factPage2],
      accessibleName: 'Sample: papyrus fact sheet, A4, 2 pages',
      html: 'fact-sheet.html',
      pdf: 'fact-sheet.pdf',
    },
    {
      id: 'release-notes',
      name: 'papyrus release notes',
      title: 'papyrus release notes 26.11.0 to 26.11.2',
      sheet: SHEETS.LETTER,
      sheetKey: 'letter',
      sizeLabel: 'US Letter · 8.5 × 11 in',
      pages: [notes],
      accessibleName: 'Sample: papyrus release notes, US Letter, 1 page',
      html: 'release-notes.html',
      pdf: 'release-notes.pdf',
    },
  ];
}

/** The documents as shown on the /papyrus page (titles at h3, sections at h4). */
export const sampleDocs = buildDocs(3);

/**
 * A standalone HTML file: the same pages, with the full sheetCss() and the
 * grey canvas. `papyrus pdf` prints these files; they are also served at
 * /papyrus-samples/ as the full-size view of each sheet.
 *
 * @param {string} id
 */
export function standaloneHtml(id) {
  const doc = buildDocs(1).find((d) => d.id === id);
  if (!doc) throw new Error(`Unknown sample document "${id}"`);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${doc.title}</title>
<style>${standaloneCss}${sheetCss(doc.sheet)}${paperCss}${fitCss(doc.sheet)}</style>
</head>
<body>
<div class="${CONTAINER_CLASS} sample">
${doc.pages.join('\n')}
</div>
</body>
</html>
`;
}

/** On a screen narrower than the sheet, shrink the sheets to fit instead of scrolling sideways. */
function fitCss(/** @type {typeof SHEETS.A4} */ sheet) {
  const w = sheet.viewport.width;
  return `
@media screen and (max-width: ${w + 40}px) {
  .${CONTAINER_CLASS} { padding: 16px 0; }
  .${CONTAINER_CLASS} .${PAGE_CLASS} { zoom: tan(atan2(100vw, ${w}px)); margin-bottom: 16px; }
}
`;
}
