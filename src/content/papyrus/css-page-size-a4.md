---
title: "CSS page size A4: print a page as it looks on screen"
description: "Set the CSS page size A4 with @page, build sheets of 210 by 297 mm, and get one printed or PDF page per sheet that matches what the browser shows."
h1: "CSS page size A4: make the printout match the screen"
mainKeyword: "css page size a4"
kind: how-to
draft: true
published: 2026-11-24
updated: 2026-11-24
author: n-uf
takeaways:
  - "`@page { size: A4; margin: 0 }` sets the paper; a 210 mm by 297 mm element per page makes the screen match it."
  - "A4 is about 794 by 1123 CSS pixels, because MDN defines 1in as 96px and 1in as 2.54cm."
  - "MDN lists `size` as supported from Chrome 15, Edge 79, Firefox 95 and Safari 18.2, with the portrait and landscape keywords unsupported in Safari."
  - "Content taller than one sheet is not split for you: you place the breaks."
  - "Count the printed pages and compare them with the number of sheet elements."
faq:
  - q: "How do I set A4 in CSS for printing?"
    a: "Add `@page { size: A4; }` to your stylesheet. MDN defines the `A4` keyword as the ISO size, 210 mm by 297 mm, and says `size` defines the size and orientation of the page box. Add `margin: 0` if you lay the page out yourself."
  - q: "What is A4 in pixels in CSS?"
    a: "About 794 by 1123 CSS pixels. MDN defines `1in` as `96px` and `1cm` as `96px / 2.54`, so 210 mm is 793.7 px and 297 mm is 1122.5 px. On a low-resolution screen, MDN notes, the sheet may not measure 210 mm with a ruler."
  - q: "How do I print A4 landscape in CSS?"
    a: "Write `@page { size: A4 landscape; }`. MDN's compatibility table marks the `landscape` and `portrait` keywords as unsupported in Safari. The syntax also accepts two lengths, width first, so `size: 297mm 210mm` describes the same page box; we have not tested that form in Safari."
  - q: "Can I put @page inside @media print?"
    a: "Yes. MDN's `size` page has an example of an `@page` rule nested inside `@media print`. MDN's printing guide says styles in `@media print` are used only for printed content."
  - q: "What happens if the paper in the printer is not A4?"
    a: "The browser decides. The W3C draft lists what it should do, in order of preference: render the page box on a larger sheet, rotate it, scale it, slice it over several sheets, or clip it. It adds that the browser may consult the user first."
sources:
  - title: "MDN: @page at-rule"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@page"
    checked: 2026-11-11
    supports: "@page changes a printed page's dimensions, orientation and margins; size indicates the destination sheet in the general case; the example's print-color-adjust; @page support (Chrome 2, Edge 12, Firefox 19, Safari 18.2)"
  - title: "MDN: size descriptor (@page)"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@page/size"
    checked: 2026-11-11
    supports: "size values and syntax (A4 = 210 x 297 mm, letter = 8.5 x 11 in, one or two lengths, portrait default, initial auto), the @media print example, compatibility of size and of the landscape/portrait keywords (no Safari)"
    quote: "This matches the standard, ISO dimensions: 210mm x 297mm."
  - title: "MDN: CSS length units"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length"
    checked: 2026-11-11
    supports: "1in = 2.54cm = 96px, 1cm = 96px / 2.54, 1mm = 1cm / 10, and that on low-dpi devices physical units may not match their real size"
  - title: "MDN: break-before"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/break-before"
    checked: 2026-11-11
    supports: "break-before: page forces a page break before the box; applies to block-level elements; page value from Chrome 50, Edge 79, Firefox 65, Safari 10"
  - title: "MDN: page-break-before"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/page-break-before"
    checked: 2026-11-11
    supports: "page-break-before is replaced by break-before, treated as its alias, and marked deprecated"
  - title: "MDN: box-sizing"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/box-sizing"
    checked: 2026-11-11
    supports: "border-box includes padding and border in width and height"
  - title: "MDN: overflow"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow"
    checked: 2026-11-11
    supports: "overflow: hidden clips content at the padding box"
  - title: "MDN: Printing"
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing"
    checked: 2026-11-11
    supports: "styles in @media print are used only for printed content, on paper or as a PDF"
  - title: "MDN: window.print()"
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Window/print"
    checked: 2026-11-11
    supports: "window.print() opens the print dialog"
  - title: "W3C: CSS Paged Media Module Level 3 (Working Draft, 14 September 2023)"
    url: "https://www.w3.org/TR/css-page-3/"
    checked: 2026-11-11
    supports: "the A4 and letter keyword definitions, A4 landscape as a 297 mm by 210 mm page box, output on the indicated size when possible, and what the browser should do when the sheet does not fit the page box"
  - title: "Wikipedia: ISO 216"
    url: "https://en.wikipedia.org/wiki/ISO_216"
    checked: 2026-11-11
    supports: "A4 is 210 x 297 mm under ISO 216"
  - title: "papyrus README (@n-uf/papyrus v26.11.1)"
    url: "https://github.com/n-uf/papyrus/blob/v26.11.1/packages/papyrus/README.md"
    checked: 2026-11-11
    supports: "page contract, SHEETS and sheetCss(), sheet-a4.css and sheet-letter.css, the page-count check, Playwright as the printer, the not-yet-stable warning"
  - title: "papyrus source: src/core/sheet.js (v26.11.1)"
    url: "https://github.com/n-uf/papyrus/blob/v26.11.1/packages/papyrus/src/core/sheet.js"
    checked: 2026-11-11
    supports: "what sheetCss() outputs: @page size and zero margin, sheet width and height, break-after: page and break-inside: avoid-page in print, clipped main content, a grey canvas with shadowed sheets on screen; A4 viewport 794 x 1123 and Letter 816 x 1056"
related:
  - /papyrus
  - /papyrus/css-page-break-print
  - /papyrus/playwright-pdf-from-html
---
To set the CSS page size to A4, put `@page { size: A4; margin: 0 }` in your stylesheet and make every page of the document an element 210 mm wide and 297 mm tall. The `@page` rule tells the browser which paper to use. The sized element makes the screen show the same sheet that comes out of the printer or the PDF, one element per printed page. That pair is the whole answer; the rest is detail.

Here it is in one file you can paste and open:

```html
<!doctype html>
<meta charset="utf-8">
<title>Sheets</title>
<style>
  @page { size: A4; margin: 0; }
  body { margin: 0; background: #888; }
  .sheet {
    box-sizing: border-box;
    width: 210mm;
    height: 297mm;
    padding: 15mm;
    margin: 10mm auto;
    background: #fff;
    overflow: hidden;
  }
  @media print {
    body { background: none; }
    .sheet { margin: 0; }
    .sheet + .sheet { break-before: page; }
  }
</style>
<section class="sheet"><h1>Page one</h1></section>
<section class="sheet"><h1>Page two</h1></section>
```

On screen you get two white sheets on a grey canvas. Print it, or pick "Save as PDF" in the print dialog, and you get two A4 pages with one sheet on each. We printed this file to PDF in headless Chrome: two pages, each 595 × 842 points, which is A4.

## Set the CSS page size to A4 with @page

`@page` is the at-rule for printed pages. MDN says it changes a page's dimensions, orientation and margins. For a print page size in CSS, the part you need is the `size` descriptor.

`size` takes a paper keyword, one or two lengths, or `auto`. MDN's `size` page defines `A4` as the ISO size, 210 mm by 297 mm, and `letter` as 8.5 by 11 inches. The initial value is `auto`, which leaves the choice to the browser. One length makes a square page. With two, the first is the width and the second the height.

Portrait is the default, so `size: A4` already means portrait. `size: 210mm 297mm` says the same thing in lengths. For a landscape sheet, add the keyword:

```css
@page { size: A4 landscape; }
```

The `margin` descriptor sets the space around the page box. The example sets it to zero because each sheet carries its own padding. The sheet you see on screen and the one that prints then have the same inner spacing, set in one place.

### What the print dialog does with it

`size` names the paper you want, and in the usual case of one page box per sheet, MDN says, it also indicates the size of the sheet. The CSS Paged Media draft asks browsers to print on that size when possible. When the real paper differs, the draft lists what the browser should do, in order of preference: print on a larger sheet, rotate the page box, scale it, slice it over several sheets, or clip it. It may ask the user first. The print dialog has the last word, and CSS can't overrule it.

### Browser support

MDN's compatibility table, read on 11 November 2026, lists the `size` descriptor from Chrome 15, Edge 79, Firefox 95 and Safari 18.2 (Safari on iOS 18.2 too). `@page` itself arrived earlier in most engines: Chrome 2, Edge 12 and Firefox 19, with Safari at 18.2.

If your readers print from Safari, one row matters. The same table marks the `landscape` and `portrait` keywords as unsupported in Safari and Safari on iOS. The two-length form is part of the same syntax, and the W3C draft describes `A4 landscape` as a page box 297 mm wide and 210 mm high, so `size: 297mm 210mm` asks for the same page. Chrome printed it as landscape A4 for us. We have not tested it in Safari, so try it there before you rely on it. The W3C module is still a working draft, dated 14 September 2023.

## A sheet on screen the size of the paper

`@page` only affects printing. On screen you need an element that looks like the sheet of paper, so that what you edit is what you print. That is all a CSS A4 page layout is: one fixed-size box per page, on a canvas that isn't part of the page.

The A4 page size in HTML and CSS is 210 mm by 297 mm, so use millimetres. MDN defines `1in` as `96px`, `1cm` as `96px / 2.54` and `1mm` as a tenth of a centimetre. For A4 that gives:

- 210 mm = 210 / 25.4 × 96 = 793.7 CSS pixels
- 297 mm = 297 / 25.4 × 96 = 1122.5 CSS pixels

So the A4 page size in pixels is about 794 × 1123. Either unit works, but millimetres match the `A4` keyword exactly and pixels don't, since 793.7 isn't a whole number. MDN also warns that on low-resolution screens a CSS inch need not match a physical one. The sheet on your screen will have the right proportions, but it may not measure 210 mm if you hold a ruler to it.

Two lines in the example keep the sheet honest. `box-sizing: border-box` makes `width` and `height` include padding and border, so the 15 mm of padding stays inside the 297 mm. `overflow: hidden` clips anything that sticks out past the padding box, so nothing runs off the bottom edge.

The grey canvas is decoration for the screen. Styles in `@media print` are used only for printed content, MDN says, and there the example drops the background and the gaps between sheets. If you need a coloured background to print, MDN's `@page` example sets `print-color-adjust: exact` (and the `-webkit-` prefixed form) on its sections.

### A4 and US Letter side by side

| Paper | `@page` keyword | Millimetres | Inches | CSS pixels |
| --- | --- | --- | --- | --- |
| A4 | `A4` | 210 × 297 | about 8.27 × 11.69 | about 794 × 1123 |
| US Letter | `letter` | 215.9 × 279.4 | 8.5 × 11 | 816 × 1056 |

The Letter figures follow from the same definitions: 8.5 in is 8.5 × 25.4 mm, or 8.5 × 96 px. To move a document from A4 to Letter, change three values together: the `@page` keyword, the sheet's width and its height.

```css
@page { size: letter; margin: 0; }
.sheet { width: 8.5in; height: 11in; }
```

Keep them in one stylesheet. Change the keyword and forget the sheet, and the sheet no longer fills the page. If the sheet ends up bigger than the paper, you're back to the browser's fallbacks: scale, slice or clip.

## One sheet per printed page

The rule `.sheet + .sheet { break-before: page; }` forces a page break before every sheet except the first. MDN says `break-before: page` forces a page break right before the box and applies to block-level elements. Using `.sheet + .sheet` means the first sheet doesn't push an empty page out ahead of itself.

With the `@page` margin at zero and each sheet exactly one page tall, every sheet lands on a page of its own. MDN lists the `page` value from Chrome 50, Edge 79, Firefox 65 and Safari 10. The older `page-break-before: always` still works as an alias; MDN marks it deprecated and replaced by `break-before`.

The catch is content taller than a sheet. `overflow: hidden` clips it, so a long table or article loses its tail in print. CSS won't make a new sheet for you. You split the content into sheets yourself, by hand or in code, and decide where each one ends.{{live:/papyrus/css-page-break-print}} How a browser breaks inside a box is its own topic, covered in [css page break print](/papyrus/css-page-break-print): forcing breaks, avoiding them, and why `break-inside: avoid` sometimes seems to do nothing.{{/live}}

## Check the printed result

Don't trust the output until you've counted it. The check is the same for one sheet or twenty:

1. Open the print preview. `window.print()` opens the print dialog, so a button that calls it is handy while you work.
2. Count the sheets in the console: `document.querySelectorAll(".sheet").length`.
3. Count the pages in the preview or in the saved PDF.

If the numbers differ, a sheet is taller than its page or something added a break. When we made both sheets in the example 3 mm too tall, headless Chrome printed four pages for two sheets. It's a cheap check, and it catches the mistake that's easiest to miss.

{{live:/papyrus/playwright-pdf-from-html}}You can run it from a script too. [Printing the page to PDF with Playwright](/papyrus/playwright-pdf-from-html) and counting the pages takes a few lines of Node.{{/live}}

## How papyrus handles it

papyrus, a toolkit by n-uf for documents rendered as HTML and exported as PDF, does the CSS above and the page check for you. Its core idea is the [page contract](/papyrus): each element with the class `pdf-page` is one sheet on screen and one page in the PDF.

```js
import { SHEETS, sheetCss } from "@n-uf/papyrus";

const css = sheetCss(SHEETS.A4);   // or SHEETS.LETTER
```

`sheetCss(SHEETS.A4)` returns a stylesheet that does what this article built by hand. It sets `@page { size: A4; margin: 0; }`. In print it sizes each page element to 210 mm × 297 mm with `break-after: page` and `break-inside: avoid-page`, plus the old `page-break-*` names. On screen it puts the sheets, with a shadow, on a grey canvas. Its `SHEETS` table also stores the viewport for each sheet: 794 × 1123 pixels for A4 and 816 × 1056 for Letter, the same figures as the table above. Pages without a bundler can link the ready-made `@n-uf/papyrus/sheet-a4.css` or `sheet-letter.css`.

The PDF exporter then counts the page elements and checks the PDF's page count against them, and against the expected `pageCount` if you set one. If they disagree, it doesn't write the PDF. It prints with headless Chromium through Playwright; papyrus and n-uf are not affiliated with Microsoft's Playwright project or with the browser makers named here.

papyrus is young. Its versions are dates (`YY.M.R`; 26.11.1 is current as we write), not semantic versions, so any release may break things. Pin an exact version and read the CHANGELOG before you upgrade. The product page, [html to pdf a4 with papyrus](/papyrus), covers install, the CLI and the React package.

## What to remember

- `@page { size: A4; margin: 0 }` sets the paper. It changes nothing on screen.
- A sheet element of 210 mm by 297 mm, one per page, makes the screen match the print.
- A4 is about 794 by 1123 CSS pixels; Letter is 816 by 1056.
- The browser decides what happens when the paper differs, and Safari doesn't support the landscape keyword.
- Long content has to be split into sheets by you.{{live:/papyrus/css-page-break-print}} [The page-break rules](/papyrus/css-page-break-print) tell you how.{{/live}} Count the pages to confirm.
