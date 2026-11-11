---
title: "CSS print header and footer: repeat them on every page"
description: "CSS print header and footer on every page: position fixed, @page margin boxes and a repeating thead, with browser support and hiding the browser's own."
h1: "CSS print header and footer on every printed page"
mainKeyword: "css print header and footer"
kind: how-to
draft: true
published: 2026-12-22
updated: 2026-12-22
author: n-uf
takeaways:
  - "Three things can repeat on every printed page: a `position: fixed` box, an `@page` margin box such as `@top-center`, and a table's `thead` and `tfoot` where the browser repeats them."
  - "`position: fixed` makes no room for itself. In our Chrome 157 test, body text ran under the fixed header and footer."
  - "MDN's table lists `@page` margin boxes in Chrome 131, Edge 131 and Opera 116, and not in Firefox or Safari."
  - "CSS 2.1 says print browsers \"may\" repeat a `thead`. Chrome 157 repeated a real `thead` on every page in our test, and didn't repeat a `div` or `tbody` styled as `table-header-group`."
  - "The date, title and URL the browser adds are a print-dialog setting. Chrome's blog says a page margin of 0, or one too small for them, keeps them off."
faq:
  - q: "How do I add a header and footer to every printed page in CSS?"
    a: "Use `@page` margin boxes such as `@top-center` and `@bottom-center` if you print from Chrome, Edge or Opera, or a `position: fixed` element, which CSS 2.1 says is repeated on every page in print. MDN's table lists margin boxes from Chrome 131 and not in Firefox or Safari. A fixed element doesn't reserve space for itself, so plan for the text under it."
  - q: "Why does my fixed header cover the text on the second page?"
    a: "A fixed box is placed against the page and takes no room in the text flow, so from page 2 on the text starts at the top of the page and runs under it. Padding on `body` or `main` only moves the text on the first page. In our Chrome 157 test, spacer rows in a `thead` and `tfoot` kept the text clear on every page."
  - q: "How do I repeat a table header on every printed page?"
    a: "Put the header row in a real `thead` element. CSS 2.1 says print user agents may repeat header rows on each page a table spans, and Chrome 157 did in our test. A `thead` switched to `display: table-row-group`, a `tbody` given `display: table-header-group`, and `div` elements styled as a table header did not repeat."
  - q: "How do I hide the header and footer the browser adds when printing?"
    a: "Turn off the headers and footers option in the print dialog. Chrome's blog says they also won't display if the page margin is 0 or too small to hold them. In a script, Playwright prints none unless you set `displayHeaderFooter` to true."
  - q: "Do @page margin boxes work in Firefox and Safari?"
    a: "No, not as of 11 November 2026. MDN's compatibility table marks every `@page` margin box as experimental and lists it as unsupported in Firefox and Safari. Chrome 131, Edge 131 and Opera 116 are the first versions with them."
sources:
  - title: "MDN: @page at-rule (compatibility table read in Chrome)"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@page"
    checked: 2026-11-11
    supports: "margin at-rules go inside @page and target sections of the printed page; margin-box compatibility (Chrome 131, Edge 131, Opera 116, Chrome Android 131; Firefox, Safari and Safari on iOS: No; marked Experimental)"
  - title: "MDN browser-compat-data 8.1.8 (npm, published 2026-11-02, the latest on 2026-11-11)"
    url: "https://www.npmjs.com/package/@mdn/browser-compat-data/v/8.1.8"
    checked: 2026-11-11
    supports: "the same margin-box versions in css.at-rules.page.at_top-center and the other 15 margin boxes; used to cross-check the table"
  - title: "MDN: position"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position"
    checked: 2026-11-11
    supports: "in printed documents a fixed element is placed in the same position on every page"
    quote: "In printed documents, the element is placed in the same position on every page."
  - title: "W3C: CSS 2.1, Visual formatting model (9.6.1 Fixed positioning)"
    url: "https://www.w3.org/TR/CSS21/visuren.html#fixed-positioning"
    checked: 2026-11-11
    supports: "in print the fixed box is rendered on every page and fixed with respect to the page box; for paged media, boxes with fixed positions are repeated on every page; a media-dependent @media rule for different screen and print results"
  - title: "W3C: CSS 2.1, Tables (17.2)"
    url: "https://www.w3.org/TR/CSS21/tables.html"
    checked: 2026-11-11
    supports: "thead is table-header-group and tfoot is table-footer-group; print user agents may repeat header and footer rows on each page spanned by a table; only the first such group is the header or footer"
    quote: "Print user agents may repeat header rows on each page spanned by a table."
  - title: "MDN: <thead>"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/thead"
    checked: 2026-11-11
    supports: "in a multipage table, the table head usually specifies information that remains the same on each page"
  - title: "MDN: Printing"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing"
    checked: 2026-11-11
    supports: "styles in @media print are used only for printed content, on paper or as a PDF"
  - title: "W3C: CSS Paged Media Module Level 3 (Working Draft, 14 September 2023)"
    url: "https://www.w3.org/TR/css-page-3/"
    checked: 2026-11-11
    supports: "16 page-margin boxes, typically used for running headers and footers; page-margin boxes contain generated content, like pseudo-elements; a box is generated only if content is not none; top-center text is centred by default; the :first, :left and :right page selectors"
  - title: "Chrome for Developers: Add content to the margins of web pages when printed using CSS (30 October 2024)"
    url: "https://developer.chrome.com/blog/print-margins"
    checked: 2026-11-11
    supports: "margin boxes from Chrome 131; the @page margin sets the size of the top and bottom boxes; the boxes between the corners stretch like flex items; the @page :right example; the browser adds its own header and footer when there is room, even if you add yours; they can be turned off in the print dialog; a margin of 0, or too small to hold them, keeps them off; the first-page quirk; string-set listed under future possibilities"
  - title: "Playwright: Page, page.pdf()"
    url: "https://playwright.dev/docs/api/class-page"
    checked: 2026-11-11
    supports: "displayHeaderFooter defaults to false; headerTemplate and footerTemplate; the date, title, url, pageNumber and totalPages classes; script tags are not evaluated and page styles are not visible in templates"
  - title: "Playwright: Browsers (Chromium headless shell and new headless mode)"
    url: "https://playwright.dev/docs/browsers"
    checked: 2026-11-11
    supports: "headless runs use a separate Chromium headless shell by default; the chrome channel uses the installed Google Chrome; expect different behavior in some cases"
  - title: "papyrus README (@n-uf/papyrus v26.11.1)"
    url: "https://github.com/n-uf/papyrus/blob/v26.11.1/packages/papyrus/README.md"
    checked: 2026-11-11
    supports: "page contract (each pdf-page element is one sheet on screen and one PDF page); the page-count check before a PDF is written; the not-yet-stable warning and calendar versions"
  - title: "papyrus source: src/core/sheet.js (v26.11.1)"
    url: "https://github.com/n-uf/papyrus/blob/v26.11.1/packages/papyrus/src/core/sheet.js"
    checked: 2026-11-11
    supports: "sheetCss() writes @page { size; margin: 0 } and sizes each page element to the sheet in print"
  - title: "papyrus-react README (@n-uf/papyrus-react v26.11.1)"
    url: "https://github.com/n-uf/papyrus/blob/v26.11.1/packages/papyrus-react/README.md"
    checked: 2026-11-11
    supports: "DocumentFooter renders only what you pass (title and copyright props)"
related:
  - /papyrus
  - /papyrus/css-page-size-a4
  - /papyrus/css-page-break-print
  - /papyrus/playwright-pdf-from-html
---
A CSS print header and footer that repeats on every page can come from three places. A `position: fixed` element is drawn on every printed page. An `@page` margin box such as `@top-center` or `@bottom-center` is the tool made for it, but MDN's table lists it only in Chrome, Edge and Opera. And a table's `thead` and `tfoot` may repeat on each page the table spans. Each has a catch: a fixed box makes no room for itself, margin boxes are only in Chromium-based browsers today, and CSS 2.1 allows a repeating `thead` without requiring it.

The other half of the problem is the header and footer the browser adds on its own, which comes after these three. Paper size is covered in [css page size a4](/papyrus/css-page-size-a4), and where a page ends in [css page break print](/papyrus/css-page-break-print).

Every test on this page was printed on 11 November 2026 with the installed Google Chrome 157, driven by Playwright with `channel: "chrome"`. Playwright's own headless runs use a separate Chromium headless shell by default, and its docs say to expect different behavior in some cases. We didn't test that shell, or any other browser.

## A CSS print header on every page with position: fixed

MDN says that in printed documents a `position: fixed` element "is placed in the same position on every page". CSS 2.1 says the box is rendered on every page and is fixed with respect to the page box. It also suggests an `@media` rule if you want a different result on screen.

```html
<style>
  @page { size: A4; margin: 0; }
  .head, .foot { position: fixed; left: 0; right: 0; height: 15mm; }
  .head { top: 0; }
  .foot { bottom: 0; }
  main { padding: 20mm 15mm; }
</style>
<div class="head">Quarterly report</div>
<div class="foot">Confidential</div>
<main>
  <!-- the document -->
</main>
```

With 120 short paragraphs in `main`, this printed four A4 pages, with the head and foot on all four.

The text is the problem. A fixed box is out of the flow, so nothing makes room for it. From page 2 on, the first line sat at the very top of the page, under the header, and on every page the last lines ran under the footer. Padding on `main` or `body` doesn't help: it applies once, at the top of the first page and the bottom of the last.

Page margins didn't fix it either. With `@page { margin: 20mm 15mm }`, the fixed boxes moved to the top and bottom of the page area, and still covered the first and last lines of each page.

What worked was spacer rows. Put the document in a table whose `thead` and `tfoot` each hold an empty box a little taller than the header and footer. When the browser repeats those rows on every page, they push the text clear of the fixed boxes:

```html
<style>
  @page { size: A4; margin: 0; }
  .head, .foot { position: fixed; left: 0; right: 0; height: 15mm; }
  .head { top: 0; }
  .foot { bottom: 0; }
  table { border-collapse: collapse; width: 100%; }
  td { padding: 0 15mm; }
  .space-top, .space-bottom { height: 20mm; }
</style>
<div class="head">Quarterly report</div>
<div class="foot">Confidential</div>
<table>
  <thead><tr><td><div class="space-top"></div></td></tr></thead>
  <tfoot><tr><td><div class="space-bottom"></div></td></tr></tfoot>
  <tbody><tr><td><!-- the document --></td></tr></tbody>
</table>
```

The same 120 paragraphs gave five pages. The header and footer were on each, and every line of text sat between them. Treat this as a Chrome technique: it only works where the `thead` and `tfoot` repeat, and we have only seen that in Chrome 157.

## A CSS print header and footer in @page margin boxes

The print-specific way to make a running footer or header is the margin box. MDN says margin at-rules go inside `@page` and each targets a section of the printed page. There are sixteen: four corners and three along each side. Chrome's blog explains the sizing. The height of the top and bottom boxes, and the width of the side boxes, come from the margin you set in `@page`. The three boxes between the corners stretch to fill the space, like flex items.

```css
@page {
  size: A4;
  margin: 20mm 15mm;
  @top-center { content: "Quarterly report"; }
  @bottom-center { content: "Confidential"; }
}
```

Both lines printed on all five pages, and no text ran under them, because they live in the margin, outside the page area. The CSS Paged Media draft says page-margin boxes are typically used for running headers and footers, and that a box is generated only if its `content` isn't `none`. What goes in is generated content, as in `::before`: strings and counters, not elements from your page. You style it with ordinary text properties inside the margin rule. By the draft's defaults, text in a top-center box is centred.

You can pick pages, too. `@page :first`, `:left` and `:right` select the first, left and right pages, and Chrome's blog uses `@page :right` to put text in a margin box on right-hand pages only. A book-style running title that follows your headings needs `string-set`. Chrome's post of October 2024 lists it under "future possibilities", and Chrome 157 ignored it in our test.

### Browser support for margin boxes

MDN's compatibility table for `@page` marks each margin box as experimental. We read it in a browser on 11 November 2026 and checked it against MDN's browser-compat-data package, version 8.1.8:

| Browser | Margin boxes since |
| --- | --- |
| Chrome, Chrome Android | 131 |
| Edge | 131 |
| Opera | 116 |
| Firefox | No |
| Safari, Safari on iOS | No |

Chrome's post of 30 October 2024 says the same about Chrome 131. So in Firefox or Safari, a margin box can't carry a CSS print header and footer: nothing prints there, and a fixed element or a `thead` has to do the job. If a script prints the page with Chromium, the engine is what counts, not the reader's browser.

{{live:/papyrus/css-print-page-numbers}}Page numbers in these boxes have their own article, [css print page numbers](/papyrus/css-print-page-numbers).{{/live}}

## Repeat a table header on every printed page

For a long table, the header row is the part people want on every page. CSS 2.1 maps `thead` to `display: table-header-group` and `tfoot` to `table-footer-group`, and says print user agents may repeat header rows on each page spanned by a table, and footer rows the same way. MDN's page on `thead` says the head of a multipage table usually holds information that stays the same on each page.

"May" is a permission, not a promise. In Chrome 157, a 100-row table with a `thead` printed on four pages, with the header on all four. With a `tfoot` added, the footer row repeated on all four as well.

Three variations did not repeat:

- `thead { display: table-row-group }`, which turns it into an ordinary body group;
- a `tbody` given `display: table-header-group`;
- `div` elements given `display: table` and `display: table-header-group`.

In each, the header printed once, on page 1. So in Chrome, use the real `thead` element and leave its `display` alone. CSS 2.1 also says that only the first header group in a table is rendered as the header. How rows split across pages is in the page-break article.

## Hide the browser's own header and footer

The header and footer nobody wrote is the one people most often want gone: the date, page title, URL and page number around the page. Chrome's blog says the browser adds them if there is room, even if you added content of your own, and that they can be turned off in the print dialog. CSS can't change that setting. It can leave no room for them: with a page margin of 0, or one too small for the browser's content, they don't display.

Two warnings from the same post. With a zero margin, your own content starts at the paper's edge, so give it padding. And because of a default page layout in Chromium, if the first page has no room for the browser's content, that stops it on later pages too, even where they do have room.

If what you want to hide is your own site's header and footer, so they don't print at all, that's plain print CSS. MDN says styles in `@media print` are used only for printed content, on paper or as a PDF:

```css
@media print {
  .site-header, .site-footer { display: none; }
}
```

### In a Playwright script

Playwright prints no header or footer unless you ask: `displayHeaderFooter` defaults to `false`. When we set it to `true` with no templates, Chrome 157 printed a header and footer of its own: the date and time at the top, and the file's URL and "1/5" at the bottom (the test page had no title). Playwright's docs don't describe that default, so pass your own templates, with an empty element for a part you don't want. The templates can use the classes `date`, `title`, `url`, `pageNumber` and `totalPages`. Scripts in them don't run and the page's styles don't reach them, so style them inline. [Generating a PDF from HTML with Playwright](/papyrus/playwright-pdf-from-html) has a working script.

## Fixed sheets with a running head of their own

Everything above lets the browser decide where pages end and then repeats something on each. The other way is to decide yourself, as the [page-break article](/papyrus/css-page-break-print) describes for breaks. On fixed sheets, each page is one element of a known size, so its header and footer are ordinary elements inside it. Nothing repeats, so nothing needs to reserve space, and nothing can run under anything.

papyrus is a toolkit by n-uf for documents rendered as HTML and exported as PDF, and it works this way. Its page contract says each element with the class `pdf-page` is one sheet on screen and one page in the PDF. In print, `sheetCss()` writes `@page` with the sheet's size and `margin: 0`, and sizes each page element to the sheet (paper sizes are in [css page size a4](/papyrus/css-page-size-a4)). There is no page margin for a margin box to live in, so the head and foot belong inside the sheet. In `@n-uf/papyrus-react`, `DocumentFooter` renders only what you pass it, such as a `title` and a `copyright`. If a sheet's content spills onto an extra page, the exporter finds that the PDF's page count and the page elements disagree, and doesn't write the file.

papyrus is young. Its versions are dates (`YY.M.R`), not semantic versions, so any release may break things. Pin an exact version and read the CHANGELOG before you upgrade. The [html to pdf a4 page](/papyrus) has the rest. papyrus and n-uf are not affiliated with Microsoft's Playwright project or with the browser makers named here.

## What to remember

- A `position: fixed` box repeats on every printed page but reserves no room. Spacer rows in a repeating `thead` and `tfoot` kept text clear of it in Chrome 157.
- `@page` margin boxes are the cleanest CSS print header and footer, and MDN lists them in Chrome 131, Edge 131 and Opera 116 only.
- For table headers, use a real `thead`. Repeating it is allowed, not required, and Chrome 157 does.
- The browser's date, title and URL are a print-dialog setting. In Chrome, a zero margin, or one too small for them, keeps them off.
