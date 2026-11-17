---
title: "React PDF viewer custom toolbar: tools, zoom, thumbnails"
description: "Build a React PDF viewer custom toolbar with kavun: your own tools and commands, a zoom field, thumbnails and full screen around any PDF renderer."
h1: "React PDF viewer custom toolbar: tools, zoom and thumbnails"
mainKeyword: "react pdf viewer custom toolbar"
kind: use-case
published: 2026-11-17
updated: 2026-11-17
author: n-uf
takeaways:
  - "kavun draws no PDF pages: your app supplies each page through `renderPage`, from pdf.js or any other renderer, and kavun is the toolbar, zoom, thumbnails and panels around it."
  - "A custom toolbar is the `toolbar` prop: your own tool items, the active id and an `onChange` handler, with an optional single-key shortcut per tool."
  - "Zoom is a value you own, `zoom` and `onZoomChange` in percent, and a zoom field the viewer can type into; fit height, fit width and no fit are in the window menu."
  - "`renderThumbnail` turns on the PAGES panel, and full screen is built in."
  - "The package is private and not installable yet; the dossier runs live on kavun.n-uf.com."
faq:
  - q: "Does kavun render PDF pages?"
    a: "No. kavun draws no PDF pages. Your app supplies every page through the `renderPage` prop, for example from a pdf.js canvas, and passes the page width as `renderWidth`. kavun draws what surrounds the pages: the header row, the toolbar and deck, the thumbnail rail, the panels, the zoom field and full screen."
  - q: "How do I add a custom toolbar to a React PDF viewer with kavun?"
    a: "Pass `toolbar` to `KavunDossier` with your tool `items`, the `activeId` and an `onChange` handler. Each item has an `id` and a `label`, and may have an icon, a tooltip, a single-key `shortcut`, a `group` and a `disabled` flag. kavun draws the strip and reports the viewer's pick through `onChange`."
  - q: "How do I control zoom in a React PDF viewer built with kavun?"
    a: "Hold the zoom in your own state and pass it as `zoom` with an `onZoomChange` handler; it is a percent of the page's natural width. The viewer can click the zoom field to type a value such as 120 or 1.5x, or pick a preset. `initialFit` sets whether the viewer starts fitted to height or width."
  - q: "Can viewers move the toolbar around?"
    a: "Yes. The panel tabs, tools, commands and zoom are groups the viewer can dock in the deck, a left or right side bar or the index rail, or float over the pages. The arrangement is remembered per viewer under `layoutStorageKey`. `layoutPreset` sets the starting arrangement, and null for the key turns remembering off."
  - q: "Can I install kavun today?"
    a: "Not yet. The kavun package is private for now and is not on a public registry. kavun.n-uf.com is built from it and shows every part live, including the dossier with its toolbar, deck and zoom. The code on this page is the component's real API."
sources:
  - title: "kavun: The dossier (kavun.n-uf.com/dossier)"
    url: "https://kavun.n-uf.com/dossier"
    checked: 2026-11-17
    supports: "KavunDossier is driven by props; the header row, status tape, rail and drawers, pages, spine and deck; docking; the props shown in the example"
  - title: "kavun: Deck Commands (kavun.n-uf.com/library/chrome/deck-commands)"
    url: "https://kavun.n-uf.com/library/chrome/deck-commands"
    checked: 2026-11-17
    supports: "the deck's switches and commands, a phase meter while a document prepares, and the zoom field"
  - title: "kavun: home page (kavun.n-uf.com)"
    url: "https://kavun.n-uf.com/"
    checked: 2026-11-17
    supports: "the zoom and the fit in the window handle's menu, full screen, and the − and + zoom buttons"
  - title: "kavun: Status (kavun.n-uf.com/status)"
    url: "https://kavun.n-uf.com/status"
    checked: 2026-11-17
    supports: "not public yet: the package and its sources are private for now"
  - title: "PDF.js home page (mozilla.github.io/pdf.js)"
    url: "https://mozilla.github.io/pdf.js/"
    checked: 2026-11-17
    supports: "PDF.js is a general-purpose, web standards-based platform for parsing and rendering PDFs"
related:
  - /kavun
  - /kavun/react-pdf-viewer-dark-mode
actions:
  - heading: "See the toolbar, deck and zoom on a real dossier"
    text: "kavun.n-uf.com is built from kavun itself, and its dossier page shows the header row, the deck with tools and commands, and the zoom. It is a live demo, and the package is private for now."
    label: "Open the kavun dossier demo"
    href: "https://kavun.n-uf.com/dossier"
  - heading: "Try the deck's commands and zoom field"
    text: "The kavun library page for the deck shows its switches and commands, the progress meter and the zoom field in every state. It is a live demo, and the package is private for now."
    label: "Open the deck commands demo"
    href: "https://kavun.n-uf.com/library/chrome/deck-commands"
---
A React PDF viewer custom toolbar is mostly a layout question: which controls the viewer has, where they sit and how they talk to your page renderer. kavun's dossier answers it with a deck, a tool strip and a zoom field, all driven by props. kavun draws no PDF pages. Your app supplies each page through `renderPage`, from [pdf.js](https://mozilla.github.io/pdf.js/) or any other renderer, and kavun is the interface around it.

This is one of the guides to kavun. kavun is private for now. The package `@n-uf/kavun` is not on a public registry, so you can't install it yet. The code below is its real API, and the [live dossier on kavun.n-uf.com](https://kavun.n-uf.com/dossier) shows it working. kavun is independent of PDF.js and of Mozilla.

## What does kavun add around a PDF renderer?

The dossier is a document instrument in kavun's panel language. Around the pages it has:

- a **header row** with the window controls, a status lamp, the document name, a page readout and the zoom;
- a **status tape** that drops in when something needs attention;
- an **index rail** with a drawer for the PAGES thumbnails and any panels you pass, such as notes or findings;
- the **pages**, windowed so that only the pages near the view render;
- a **spine**, a document map with marks;
- a **deck** with tools, indicators, commands and zoom.

You bring the rest. The shell owns only layout state: the open panel, the current page and the fit. Here is a viewer with a custom toolbar, a zoom you control and thumbnails:

```tsx
import { useState } from "react";
import { KavunDossier } from "@n-uf/kavun";
import type { ToolItem } from "@n-uf/angiospermae";

const tools: ToolItem[] = [
  { id: "select", label: "Select", shortcut: "V" },
  { id: "highlight", label: "Highlight", shortcut: "H" },
];

export function Viewer({ pageCount }: { pageCount: number }) {
  const [zoom, setZoom] = useState(100);
  const [tool, setTool] = useState("select");
  const pageWidth = 612 * (zoom / 100); // px; follows the zoom

  return (
    <KavunDossier
      title="Agreement.pdf"
      pageCount={pageCount}
      renderWidth={pageWidth}
      renderPage={(page) => <MyPdfPage page={page} width={pageWidth} />}
      renderThumbnail={(page, width) => <MyThumbnail page={page} width={width} />}
      zoom={zoom}
      onZoomChange={setZoom}
      toolbar={{ items: tools, activeId: tool, onChange: setTool }}
      actions={[{ id: "analyze", label: "Analyze", progress: 64 }]}
    />
  );
}
```

`MyPdfPage` and `MyThumbnail` are yours: a pdf.js canvas, an image, anything that draws a page at the width kavun gives you. That is the whole contract with the renderer.

## How do I build a React PDF viewer custom toolbar?

Give the dossier a `toolbar`: a list of tool items, the id of the active one and a change handler. kavun draws the strip and tells you which tool the viewer picked; what a tool does on the page is your code. An item needs an `id` and a `label`. It can also carry an icon, a tooltip, a single-key `shortcut` such as `"H"`, a `group` that adds a divider between neighbours, and `disabled` or `hidden` flags.

The tools are one strip of icon buttons that floats beside the side panel by default, and the viewer can move it, as the section on moving the toolbar explains below.

## How do I add commands to the deck?

Commands are the deck's buttons: Analyze, Download, Export. Pass them as `actions`, each with an `id` and a `label`. An action can be disabled, and it can be `primary`, which draws it apart from the others. When a command runs, set `progress` from 0 to 100 and its button fills as the work advances, as in the example above. Switches and indicators go in `indicators`. A `phase` text such as "OCR" can show while it runs.

Which commands exist, and what they do, is again yours. The deck only draws them and reports the click.

## How do I set up PDF viewer zoom controls and full screen?

Zoom is a value you own. Hold it in state, pass it as `zoom` with `onZoomChange`, and size your page from it with `renderWidth`. The value is a percent of the page's natural width. In the header, − and + step the zoom, and the zoom itself is a field: the viewer clicks it to type a zoom, such as `120` or `1.5x`, or picks a preset.

The **fit** is a choice of three radio rows in the window handle's menu, which opens on a right-click: Fit height, Fit width and No fit. `initialFit` sets where the dossier starts, and the default is `"height"`, the whole page in view. Only a zoom chosen by hand turns the fit off.

kavun documents − and +, the typed field and the presets, not a pinch gesture. Because `zoom` is a controlled value, a pinch handler of your own can feed it through `onZoomChange`.

**Full screen** is built in. The same window menu has a Full screen row, which toggles the browser's full screen. Pass `fullscreen={false}` if a viewer must not go full screen by itself, or give `verbs.fullscreen` to handle it in your app.

## How do I add page thumbnails?

Pass `renderThumbnail`, a function that receives a page number and a width. Giving the dossier one turns on the PAGES panel, the thumbnails on the index rail. Draw each thumbnail the way you draw the page, at the smaller width.

## Can viewers move the toolbar?

Yes, and this is the part a fixed toolbar can't do. Every part of the dossier but the title bar moves. The panel tabs, the tools, the commands and the zoom are groups, and the viewer can drag them to the deck, a left or right side bar, or the index rail, or float them over the pages. Each group has one drag handle. Drawers change sides and float too.

The arrangement is remembered per viewer under `layoutStorageKey`, or not at all when you pass `null`. `layoutPreset` gives a starting arrangement over the built-in one. Under 720 px nothing docks: the groups reorder in the deck, and the panels become sheets. This is kavun's default layout, and a viewer can make it their own.

## What is it not?

kavun does not parse or render a PDF, and it does not read files. Your renderer and your app own the pages and whatever is drawn on them. If you want a toolbar around pdf.js, kavun is that toolbar, and the page canvas stays pdf.js's job.

kavun styles itself: its components render their own scoped stylesheets, so there is no Tailwind setup and no CSS file to import. In a Next.js app, list the package and the packages it builds on in `transpilePackages`, because they ship TypeScript source:

```js
// next.config.mjs
export default { transpilePackages: ["@n-uf/kavun", "@n-uf/angiospermae", "@n-uf/papyrus-react"] };
```

{{live:/kavun/react-pdf-viewer-dark-mode}}The dossier also comes in five themes, which have their own guide on [dark mode and themes for a React PDF viewer](/kavun/react-pdf-viewer-dark-mode).{{/live}} The rest of the kit, with a guide per job, is on the [kavun guides](/kavun) page. The sister kits have their own: [harbuz guides](/harbuz) and [dynia guides](/dynia).
