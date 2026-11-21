---
title: "Best React PDF viewer: react-pdf, EmbedPDF and more"
description: "The best React PDF viewer depends on the job. react-pdf, react-pdf-viewer, EmbedPDF and PDF.js compared from their own pages, and what a UI kit adds."
h1: "Best React PDF viewer: react-pdf, react-pdf-viewer, EmbedPDF and PDF.js compared"
mainKeyword: "best react pdf viewer"
kind: best-tools
draft: true
published: 2026-12-12
updated: 2026-12-12
author: n-uf
takeaways:
  - "The best React PDF viewer depends on what you need on screen: pages only (React-PDF), a ready-made viewer (EmbedPDF, or react-pdf-viewer under a commercial licence), the rendering engine itself (PDF.js) or your own interface around any of them."
  - "React-PDF is MIT and gives you `Document`, `Page`, `Outline` and `Thumbnail`; its README documents no toolbar, so the interface is yours."
  - "react-pdf-viewer's README says a commercial licence must be bought, and its GitHub repository was archived by its owner on 25 March 2026 and is read-only."
  - "EmbedPDF is Apache-2.0 and comes as a drop-in viewer or a headless library; its page lists annotations, forms, signatures, search, redaction and stamps."
  - "kavun is none of these: it draws no pages and is the panels, toolbar and layout around one you pick. It is private and not installable yet."
faq:
  - q: "What is the best React PDF viewer?"
    a: "There isn't one for every job. React-PDF suits pages in your own layout, EmbedPDF a viewer with annotation and form features, and PDF.js the engine or its stock viewer. react-pdf-viewer has a ready toolbar but needs a commercial licence and is archived. Pick by what must be on screen and what you must build."
  - q: "What is the difference between react-pdf and react-pdf-viewer?"
    a: "They are two separate projects by different authors. React-PDF is a set of React components, `Document` and `Page` among them, that display PDFs and leave the interface to you. react-pdf-viewer is a `Viewer` component with plugins for a toolbar, thumbnails and search, under a commercial licence."
  - q: "Is react-pdf-viewer free to use?"
    a: "Its README and LICENSE file say you have to purchase a commercial licence at its official website. Its GitHub repository was archived by the owner on 25 March 2026 and is read-only. Check both before you choose it. Its site did not answer when we tried it on 20 November 2026."
  - q: "Which React PDF viewer has annotations and forms built in?"
    a: "EmbedPDF's home page lists annotations (highlight, underline, draw and add notes), forms, signatures, search, redaction and stamps, in a viewer that is Apache-2.0 licensed. React-PDF renders the PDF's own annotation layer, such as links, and leaves editing to you. Check each page's current feature list before you build on it."
  - q: "Can kavun replace the viewers in this comparison?"
    a: "No. kavun is not a PDF renderer: your app returns each page from `renderPage`, and kavun draws the toolbar, panels, zoom and layout around them. It sits on top of a renderer rather than replacing one. The package is private for now and not on a public registry, so you can't install it yet."
sources:
  - title: "React-PDF README (github.com/wojtekmaj/react-pdf)"
    url: "https://github.com/wojtekmaj/react-pdf/blob/main/packages/react-pdf/README.md"
    checked: 2026-11-20
    supports: "Display PDFs in your React app as easily as if they were images; Document, Page, Outline and Thumbnail; the PDF.js worker must be configured; annotation and text layer stylesheets; React 19 or later for the latest version; MIT licence"
  - title: "react-pdf-viewer on GitHub (github.com/react-pdf-viewer/react-pdf-viewer)"
    url: "https://github.com/react-pdf-viewer/react-pdf-viewer"
    checked: 2026-11-20
    supports: "A React component to view a PDF document; written in TypeScript; the Viewer component with plugins such as the default layout; the features list; a commercial licence must be purchased; the repository was archived by the owner on 25 March 2026"
  - title: "react-pdf-viewer LICENSE (raw.githubusercontent.com/react-pdf-viewer/react-pdf-viewer/master/LICENSE.md)"
    url: "https://raw.githubusercontent.com/react-pdf-viewer/react-pdf-viewer/master/LICENSE.md"
    checked: 2026-11-20
    supports: "You have to purchase a Commercial License at the official website"
  - title: "EmbedPDF home page (embedpdf.com)"
    url: "https://www.embedpdf.com/"
    checked: 2026-11-20
    supports: "a drop-in viewer component or a headless library; React, Angular, Vue, Svelte and vanilla JS; annotations, forms, signatures, search, redaction and stamps; Apache-2.0 licensed"
  - title: "EmbedPDF README (github.com/embedpdf/embed-pdf-viewer)"
    url: "https://github.com/embedpdf/embed-pdf-viewer"
    checked: 2026-11-20
    supports: "a PDF viewer for any web app; a PDF engine built on PDFium that runs as WebAssembly; viewer, headless components and engine; Apache-2.0"
  - title: "PDF.js home page (mozilla.github.io/pdf.js)"
    url: "https://mozilla.github.io/pdf.js/"
    checked: 2026-11-20
    supports: "a general-purpose, web standards-based platform for parsing and rendering PDFs; Apache 2.0"
  - title: "PDF.js README (github.com/mozilla/pdf.js)"
    url: "https://github.com/mozilla/pdf.js"
    checked: 2026-11-20
    supports: "a PDF viewer built with HTML5, community-driven and supported by Mozilla; an online demo viewer"
  - title: "kavun: The dossier (kavun.n-uf.com/dossier)"
    url: "https://kavun.n-uf.com/dossier"
    checked: 2026-11-20
    supports: "KavunDossier is driven by props: renderPage, renderThumbnail, zoom, panels; Pages, Annotations and Findings panels; docking"
  - title: "kavun: Status (kavun.n-uf.com/status)"
    url: "https://kavun.n-uf.com/status"
    checked: 2026-11-20
    supports: "not public yet: the package and its sources are private for now"
related:
  - /kavun
  - /kavun/react-pdf-viewer-custom-toolbar
  - /kavun/react-pdf-viewer-annotations
  - /kavun/react-pdf-viewer-dark-mode
actions:
  - heading: "See what an interface around a PDF renderer looks like"
    text: "kavun.n-uf.com is built from kavun itself, and its dossier page shows the header, deck, panels and zoom around pages it does not draw. It is a live demo, and the package is private for now."
    label: "Open the kavun dossier demo"
    href: "https://kavun.n-uf.com/dossier"
---
The best React PDF viewer is the one that draws what your screen needs and leaves you to build the rest. If you need pages in your own layout, React-PDF does that. If you need a finished viewer with annotation and form features, EmbedPDF's page describes one. If you need the rendering engine or a stock viewer, PDF.js is that. And if you already have a renderer and need the toolbar, panels and layout around it, that is a different job, which is the one kavun does. This page compares them from their own pages, fetched on 20 November 2026.

kavun is independent of React-PDF, react-pdf-viewer, EmbedPDF and PDF.js, and of their authors, and none of them endorses it. kavun is private for now: the package `@n-uf/kavun` is not on a public registry, so you can't install it yet.

## Which is the best React PDF viewer for your job?

| | React-PDF | react-pdf-viewer | EmbedPDF | PDF.js |
| --- | --- | --- | --- | --- |
| What its page calls it | "Display PDFs in your React app as easily as if they were images" | "A React component to view a PDF document" | "Embed PDF files without the pain"; an open-source PDF viewer for JavaScript | "A general-purpose, web standards-based platform for parsing and rendering PDFs" |
| Shape | React components: `Document`, `Page`, `Outline`, `Thumbnail` | A `Viewer` component with plugins | A drop-in viewer, or headless components | A library and a stock viewer, not a React component |
| Interface | Yours to build | Default layout plugin, customizable toolbar | Prebuilt toolbar and layout, or your own | The stock viewer, or your own |
| Licence | MIT | Commercial licence to be purchased | Apache-2.0 | Apache 2.0 |
| State, as its page says | README for the 11.x branch | Repository archived by its owner on 25 March 2026 | Documentation for 2.x | Community-driven, supported by Mozilla |

A table is a summary, and a summary loses detail. The sections below say what each page says and where each one fits.

## What is React-PDF?

React-PDF's README says it displays PDFs in a React app "as easily as if they were images". You put a `Document` around one or more `Page` components, and `file` can be a URL, base64 content or a `Uint8Array`. It also documents `Outline`, for a table of contents, and `Thumbnail`. It is MIT licensed, and the README for its 11.x branch says the latest version needs React 19 or later.

Two things in the README shape how it is used. The PDF.js worker has to be configured, and the README warns that the worker must match React-PDF's exact `pdfjs-dist` version. And annotation and text layers each need a stylesheet to display correctly. The README documents no toolbar, zoom control or search box. Those are for you to build, with the `scale` and `width` props of `Page` to size a page.

## What is react-pdf-viewer?

It is a different project from React-PDF, by a different author. Its GitHub page describes "a React component to view a PDF document", written in TypeScript and powered by React hooks. You render a `Viewer` with `plugins`, such as a default layout plugin. The features list includes zooming to custom levels, page navigation, text search, page thumbnails, a table of contents, rotating, full screen, printing, theming and dark mode, and says the toolbar can be customized.

Two facts on the same page matter before you choose it. The README and the LICENSE file say you have to purchase a commercial licence at the official website. And the repository banner says it was archived by the owner on 25 March 2026 and is now read-only. We could not reach its project site, react-pdf-viewer.dev, when we tried on 20 November 2026, so this section rests on the GitHub page alone.

## What is EmbedPDF?

EmbedPDF's home page calls it an open-source PDF viewer for JavaScript and offers two ways in: a ready-made viewer with a prebuilt toolbar and layout, or headless components for building your own viewer interface. It lists React, Angular, Vue and Svelte besides plain JavaScript, and it lists annotations (highlight, underline, draw and add notes), forms, signatures, search, redaction and stamps. It is Apache-2.0 licensed.

Its README says the PDF engine is built on PDFium and runs as WebAssembly; React-PDF, by comparison, runs on PDF.js. The footer of the home page says EmbedPDF is created and maintained by CloudPDF, which it describes as adding storage, permissions, real-time collaboration and server-side processing when an app needs a backend for its PDFs.

## What is PDF.js, and where does it fit?

PDF.js is the engine behind a lot of this. Its home page calls it a general-purpose, web standards-based platform for parsing and rendering PDFs, licensed under Apache 2.0, and its README says it is community-driven and supported by Mozilla. It has an online demo viewer. Its pages describe a platform and a viewer, not a React component, so in a React app you use it through a wrapper or drive it yourself.

React-PDF's README is explicit about the relationship: it needs the PDF.js worker, with `pdfjs-dist` pinned to a matching version. react-pdf-viewer's GitHub topics include pdfjs too. EmbedPDF's README names a different engine, PDFium, so the choice of library is also a choice of engine.

## React PDF viewer vs React-PDF: which do you mean?

The two names are easy to mix up, and the searches overlap. They are separate projects. React-PDF gives you building blocks and no interface. react-pdf-viewer gives you a viewer with an interface and a plugin model, under a commercial licence, and its repository is archived. If a colleague says "react pdf", ask which one, and check the licence either way.

## What does a UI kit add around the viewer you pick?

A renderer draws pages. Everything around the pages is a second piece of work: a toolbar, zoom and fit, thumbnails, side panels, themes, a layout the reader can rearrange. React-PDF's README documents none of it, so that work is yours. The prebuilt viewers include a version of it, which you accept or override.

kavun is a UI kit for that second piece. Its dossier is driven by props: your app returns each page from `renderPage`, each thumbnail from `renderThumbnail`, owns the `zoom`, and passes panels and a toolbar. It brings the header, the deck, the Pages, Annotations and Findings panels, five themes and docking, and the viewer's layout is remembered per viewer. A sketch of the pairing with React-PDF follows; it is ours, not a tested integration:

```tsx
import { useState } from "react";
import { Document, Page } from "react-pdf";
import { KavunDossier } from "@n-uf/kavun";

export function Viewer({ file }: { file: string }) {
  const [pages, setPages] = useState(0);
  const [zoom, setZoom] = useState(100);
  const width = 612 * (zoom / 100);

  return (
    <Document file={file} onLoadSuccess={({ numPages }) => setPages(numPages)}>
      <KavunDossier
        title="Agreement.pdf"
        pageCount={pages}
        renderWidth={width}
        renderPage={(page) => <Page pageNumber={page} width={width} />}
        zoom={zoom}
        onZoomChange={setZoom}
      />
    </Document>
  );
}
```

The guides to a [React PDF viewer custom toolbar](/kavun/react-pdf-viewer-custom-toolbar) and to the [panels for annotations and findings](/kavun/react-pdf-viewer-annotations) go through the parts one at a time. The [dark mode and themes guide](/kavun/react-pdf-viewer-dark-mode) covers the five themes.

## Where does each one make more sense?

- **React-PDF** makes more sense when you want PDF pages inside your own layout and are happy to build the controls, or when you need an MIT licence and the plain components.
- **react-pdf-viewer** makes more sense when a ready toolbar and plugin set matter and a commercial licence is acceptable. The archived repository is a risk to weigh: it will not receive fixes there.
- **EmbedPDF** makes more sense when the viewer must annotate, fill forms, sign or redact in the browser, or when you want an open-source viewer you can drop in, or take apart, under Apache-2.0.
- **PDF.js** makes more sense when you want the engine itself or its stock viewer, or you work outside React.
- **kavun** makes more sense when you already have a page renderer and the product needs a considered interface around it: panels that dock, themes, a deck. It makes no sense if you need something that renders pages, edits PDFs or can be installed today. It has none of those.

## How do you choose?

Choosing the best React PDF viewer starts with the screen. If you can sketch it as "pages and a few buttons", React-PDF or PDF.js is enough. If the sketch has a toolbar you do not want to write, look at the two viewers. If it has annotation tools, forms or signatures, read EmbedPDF's feature list first. If the sketch is mostly interface, with panels, a deck and a layout the reader moves, pick any renderer and put an interface kit around it.

Then read the licence, the repository's state and the current documentation. This page is a snapshot from 20 November 2026, built from each project's own words; it is not a benchmark, and we have not measured speed, bundle size or accuracy for any of them.

Every guide to the kit is listed on the [kavun guides](/kavun) page. The sister kits have their own: [harbuz's guides](/harbuz) and [dynia's guides](/dynia). The kit's own site is [kavun.n-uf.com](https://kavun.n-uf.com/).
