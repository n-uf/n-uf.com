---
title: "React PDF viewer annotations: panels beside the pages"
description: "React PDF viewer annotations with kavun: annotations and findings panels beside the pages, with page jumps, export and import. Your app owns the marks."
h1: "React PDF viewer annotations: panels that list, jump and export"
mainKeyword: "react pdf viewer annotations"
kind: use-case
draft: true
published: 2026-12-04
updated: 2026-12-04
author: n-uf
takeaways:
  - "kavun draws the panels for React PDF viewer annotations, not the marks: `AnnotationsPanel` lists the marks a person drew, `FindingsPanel` lists what an analysis found, and your app draws the marks on the pages and keeps them."
  - "Each annotation row shows its kind, its text, how often the text occurs (`×N`) and a chip per page; a click on a chip calls your `onPageClick`, and `navigationRef.goToPage` does the jump."
  - "`AnnotationsActions` adds Export, Import and Reload words to the panel header; each is shown only when you pass its handler, and what they export is your code."
  - "`FindingsPanel` groups findings by domain and kind, with scope, level and party choices, removal to a trash and restore; `spineMarks` puts marks on the document map."
  - "kavun is private and not installable yet; it does not write annotations into a PDF file, and its panels run live on kavun.n-uf.com."
faq:
  - q: "Does kavun add annotations to a PDF file?"
    a: "No. kavun draws the interface around the pages: a list of annotations, a list of findings, the tools on the deck and the spine. It does not write into the PDF. Your app draws a mark in `renderPage`, keeps it in its own store, and passes the list to `AnnotationsPanel` to show it."
  - q: "How do I jump to an annotation's page in a React PDF viewer?"
    a: "Hold a ref typed `KavunNavigation`, pass it as `navigationRef`, and call `goToPage(page)` from the `onPageClick` of `AnnotationsPanel`. The panel reports which note and which page chip was clicked; the dossier scrolls the pages. The same call works for `FindingsPanel` and for the spine."
  - q: "How do I save and load React PDF viewer annotations?"
    a: "Pass `onExport` and `onImport` to `AnnotationsActions` and put it in the panel's `headerActions`. The panel header then shows Export and Import words, and Import opens a file picker for `.json`. What the file holds, and where it is stored, is your code; kavun only draws the words and reports the click."
  - q: "What is the difference between annotations and findings in kavun?"
    a: "Annotations are marks a person drew by hand, each with the text under it and the pages where that text occurs. Findings are what an analysis found, grouped by domain and kind, with levels, a trash and filter rows. Machine results belong in `FindingsPanel`, not in the annotations list."
  - q: "Is there a demo of the annotations and findings panels?"
    a: "Yes. kavun's library has an Annotations Panel page and a Findings Panel page, each with sample rows, an empty state and the header words. The package is private for now and not on a public registry, so those pages are how you see the panels today. The code on this page is the real API."
sources:
  - title: "kavun library: Annotations Panel (kavun.n-uf.com/library/blocks/annotations-panel)"
    url: "https://kavun.n-uf.com/library/blocks/annotations-panel"
    checked: 2026-11-20
    supports: "AnnotationsPanel and AnnotationsActions: the annotations drawn by hand, each with its text, how many times the text occurs and every page it occurs on; Export, Import and Reload words in the header; machine findings go in the findings panel"
  - title: "kavun library: Findings Panel (kavun.n-uf.com/library/blocks/findings-panel)"
    url: "https://kavun.n-uf.com/library/blocks/findings-panel"
    checked: 2026-11-20
    supports: "what the analysis found, grouped by domain and kind, with page chips that jump, a trash and filter rows"
  - title: "kavun library: Spine (kavun.n-uf.com/library/chrome/spine)"
    url: "https://kavun.n-uf.com/library/chrome/spine"
    checked: 2026-11-20
    supports: "a map of the whole document on the right edge: every page a block, every finding at its height"
  - title: "kavun: The dossier (kavun.n-uf.com/dossier)"
    url: "https://kavun.n-uf.com/dossier"
    checked: 2026-11-20
    supports: "Pages, Annotations and Findings are three independent panels beside the pages; new data lights an LED on the word; the props in the example"
  - title: "kavun: Status (kavun.n-uf.com/status)"
    url: "https://kavun.n-uf.com/status"
    checked: 2026-11-20
    supports: "not public yet: the package and its sources are private for now"
  - title: "EmbedPDF: home page (embedpdf.com)"
    url: "https://www.embedpdf.com/"
    checked: 2026-11-20
    supports: "EmbedPDF is an open-source PDF viewer, as a drop-in component or a headless library, with annotations (highlight, underline, draw and add notes), forms, signatures, search, redaction and stamps; Apache-2.0"
  - title: "React-PDF README (github.com/wojtekmaj/react-pdf)"
    url: "https://github.com/wojtekmaj/react-pdf/blob/main/packages/react-pdf/README.md"
    checked: 2026-11-20
    supports: "annotations (e.g. links) in PDFs rendered by React-PDF need a stylesheet to display correctly; React-PDF is used to display existing PDFs"
related:
  - /kavun
  - /kavun/react-pdf-viewer-custom-toolbar
  - /kavun/best-react-pdf-viewer
actions:
  - heading: "See the annotations and findings panels with sample data"
    text: "The annotations panel page in kavun's library shows the list with its page chips, its empty state and its header words. It is a live demo, and the package is private for now."
    label: "Open the annotations panel demo"
    href: "https://kavun.n-uf.com/library/blocks/annotations-panel"
---
React PDF viewer annotations have two halves: drawing a mark on a page, and listing the marks so a reader can find them again. kavun does the second half. Its dossier has an annotations panel and a findings panel beside the pages, each row jumps to a page, and the header can export and import. Your app does the first half: it draws the marks on the pages and keeps them.

kavun is private for now. The package `@n-uf/kavun` is not on a public registry, so you can't install it yet. The code below is its real API, and the [annotations panel in kavun's library](https://kavun.n-uf.com/library/blocks/annotations-panel) shows it with sample data.

## What does kavun draw for annotations, and what stays yours?

kavun draws no PDF pages and no marks. The split is the same one as for the rest of the dossier:

| | kavun | Your app |
| --- | --- | --- |
| The page | the frame, the scroll, the spine | `renderPage`: the page and the marks on it |
| Choosing a tool | the tool strip on the deck | what a tool does when the reader uses it |
| The list of marks | `AnnotationsPanel` and its header words | the marks, their ids and where they are stored |
| Machine results | `FindingsPanel` | the analysis and its findings |
| Jumping | the page chips, `goToPage` | which page each mark is on |

That is the whole contract. An app that already draws highlights or boxes on a page canvas keeps doing that, and kavun gives it the list, the jumps and the places to put them.

## How do I add a panel for React PDF viewer annotations?

A panel is an item in the dossier's `panels` list: an `id`, a `label`, an optional `count`, optional `headerActions`, and the `content`. Put an `AnnotationsPanel` in the content and name the panels you want in `sidePanel`. Pages, Annotations and Findings then become three independent panels beside the pages, each switched by its own word in the deck:

```tsx
import { useRef } from "react";
import {
  AnnotationsActions,
  AnnotationsPanel,
  KavunDossier,
  type KavunAnnotationItem,
  type KavunNavigation,
} from "@n-uf/kavun";

export function Viewer({
  pageCount,
  annotations,
  onRemove,
  onExport,
}: {
  pageCount: number;
  annotations: KavunAnnotationItem[];
  onRemove: (annotation: KavunAnnotationItem) => void;
  onExport: () => void;
}) {
  const navigation = useRef<KavunNavigation>(null);
  const goTo = (page: number) => navigation.current?.goToPage(page);

  return (
    <KavunDossier
      title="Agreement.pdf"
      pageCount={pageCount}
      renderWidth={612}
      renderPage={(page) => <MyPdfPage page={page} width={612} />}
      renderThumbnail={(page, width) => <MyThumbnail page={page} width={width} />}
      navigationRef={navigation}
      panels={[
        {
          id: "annotations",
          label: "Annotations",
          count: annotations.length,
          headerActions: <AnnotationsActions onExport={onExport} />,
          content: (
            <AnnotationsPanel
              annotations={annotations}
              onPageClick={(_, page) => goTo(page)}
              onRemove={onRemove}
            />
          ),
        },
      ]}
      sidePanel={{ panels: ["pages", "annotations"] }}
    />
  );
}
```

`MyPdfPage` and `MyThumbnail` are yours, as in the guide to a [React PDF viewer custom toolbar](/kavun/react-pdf-viewer-custom-toolbar). With `count` set, the word in the deck shows it, and when new data arrives while the panel is closed the word lights an LED instead of opening the panel by itself.

## What is in an annotation row?

An annotation is a small record: an `id`, a `kind` that names the tool (such as Rect or Highlight), the `text` under the mark, the `page` it sits on, the other pages where the same text occurs (`occurrences`) and the total count of that text in the document (`matches`).

The panel shows each as a row: the kind, the text, a `×N` count, and a chip per page, `P1`, `P3` and so on. The mark's own page comes first and is lit. A click on a chip calls your `onPageClick(annotation, page)`, which is where the `goToPage` call goes. A cross that appears on hover calls `onRemove`, and its tooltip says it removes the mark and its occurrences, so decide what that means in your app. With no annotations the panel shows "No annotations yet".

## How do Export, Import and Reload work?

`AnnotationsActions` draws three words in the panel header, and each appears only when you pass its handler. `onExport` and `onRefresh` are plain click handlers. `onImport` receives the `File` the reader picks, after a file picker that accepts JSON. Each word has a matching busy flag, `exporting`, `importing` and `refreshing`, which shows it working and disables it.

Their tooltips say "Export annotations as JSON" and "Import annotations from JSON". Treat that as the intended use: the file format, the storage and the merge rules are yours.

## How do I show findings next to annotations?

Annotations are what a person marked. Findings are what an analysis found, and they have their own panel. `FindingsPanel` takes `groups`, each group holding kinds and each kind its items, with the pages of every item as chips:

```tsx
import { FindingsPanel, type KavunFindingGroup } from "@n-uf/kavun";

const groups: KavunFindingGroup[] = [
  {
    id: "parties",
    label: "Parties",
    kinds: [
      {
        id: "org",
        label: "Organisation",
        items: [{ id: "o1", value: "Atlas Financial Systems Corporation", pages: [1, 4], level: "High", tone: "caution" }],
      },
    ],
  },
];

<FindingsPanel groups={groups} onPageClick={(_, page) => goTo(page)} onRemove={(ids) => remove(ids)} />;
```

The panel adds the rest around the list: a document-type line, `scope`, `level` and `party` as rows of choices, a per-kind Remove all, and a Trash that holds removed findings and restores them. An item can be `locked`, which draws it dimmed and marked Locked, for a finding you show but do not act on. A new analysis can light the panel's word in the deck.

On the document map, `spineMarks` puts a mark at a `page` and a `position` from 0 at the top to 1 at the bottom, with an optional `tone` and `label`. The spine is a strip along the right edge, every page a block, so a reader sees where the marks cluster.

## How does the reader draw the marks?

The tool strip on the deck is the `toolbar` prop: your tool items, the active id and a change handler, as in the toolbar guide. kavun tells you which tool is active, but it does not turn a click on a page into a mark. Your `renderPage` receives the page number and draws the page and whatever marks belong on it, and your pointer handlers on that layer create them. When a mark exists, you add an entry to `annotations` and the panel shows it.

## Can viewers move the panels?

Yes. The panels dock on either side, float over the pages as windows and resize, and the arrangement is remembered per viewer under `layoutStorageKey`. Pages and Annotations start stacked in a left column, with Findings on the right. Under 720 pixels nothing docks, and a drawer becomes a sheet over the pages when there is no room beside it.

## Where does another viewer make more sense?

If the annotation has to live in the PDF itself, with highlights, underlines, ink and comments saved into the file, you want a viewer that does that. EmbedPDF's home page lists annotations (highlight, underline, draw and add notes), forms, signatures, search, redaction and stamps, as a drop-in viewer or a headless library under Apache-2.0, fetched on 20 November 2026. kavun has none of that: it is the panels, the deck and the layout.

The word is also used for something else in PDF.js-based libraries. React-PDF's README, fetched the same day, mentions annotations such as links in the PDFs it renders, and says they need a stylesheet to display correctly. Those are the PDF's own annotations, not the marks a person makes in your app. kavun is independent of EmbedPDF, React-PDF and PDF.js and has no affiliation with their makers.

## What is it not?

kavun does not read or write a PDF's annotations, does not store marks and has no drawing tools of its own. The panel's wording is shaped by redaction: its empty state reads "Mark text on a page: it is redacted everywhere it occurs", and the count is how many times the marked text occurs. You can use the list for highlights and comments, but expect that vocabulary.

The package is private too, so you can read this page and try the demo, but you can't install it yet. {{live:/kavun/best-react-pdf-viewer}}For a look at the viewers that draw the pages, see the comparison of the [best React PDF viewer](/kavun/best-react-pdf-viewer) options.{{/live}} Every guide to the kit is listed on the [kavun guides](/kavun) page. The sister kits have their own: [harbuz's guides](/harbuz) and [dynia's guides](/dynia). The kit's own site is [kavun.n-uf.com](https://kavun.n-uf.com/).
