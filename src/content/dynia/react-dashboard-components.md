---
title: "React dashboard components: stat tiles, charts, tables"
description: "React dashboard components from dynia: a dashboard shell, stat tiles, bar charts, a dense table and findings cards that you compose with your own data."
h1: "React dashboard components: a shell, stat tiles, charts and tables"
mainKeyword: "react dashboard components"
kind: use-case
published: 2026-11-17
updated: 2026-11-17
author: n-uf
takeaways:
  - "dynia's dashboard blocks only draw: your app keeps its metrics, queries and the rules that write the summary, and passes plain data in."
  - "The set is a shell (`DyniaDashboard`), a layout (`DashboardSplit`, `DashboardPanel`), stat tiles, a written summary, bars and a sparkline, a dense table and tagged findings cards."
  - "The marks are accessible by construction: `BarSeries` and `Sparkline` are images with a label and a generated text alternative, `StatGrid` is a definition list and the table scrolls in a focusable region."
  - "dynia is blocks, not an admin template: it has no routing, data fetching or auth, and its only charts are bars and a sparkline."
  - "The package is private and not installable yet; the blocks run live in dynia's library on dynia.n-uf.com."
faq:
  - q: "What are dynia's React dashboard components?"
    a: "They are app-agnostic blocks for analytics dashboards: the `DyniaDashboard` shell, `DashboardSplit` and `DashboardPanel`, `StatGrid` and `StatTile`, `Narrative` and `Mark`, `BarSeries` and `Sparkline`, `DataTable`, `WindowSwitch` and findings cards. Your app composes them and supplies the numbers, the queries and the summary rules; dynia only draws."
  - q: "Is dynia a React admin dashboard template?"
    a: "No. It is a set of components rather than a ready-made template: the app keeps its own composition, its metrics and queries, and the rules that write the summary and findings, and dynia only draws them. There is no routing, data fetching or sign-in in it, though the shell accepts your link component."
  - q: "Which charts do the React dashboard components include?"
    a: "Two marks: `BarSeries`, a bar chart with axis labels, a highlighted bar and a running period drawn as an outline, and `Sparkline`, a small trend line for tiles and table cells. Both are images with an accessible name. For other chart types, you would bring your own chart library."
  - q: "Do dynia's dashboard components need Tailwind?"
    a: "No. dynia's styles are self-contained: a scoped stylesheet with `--dy-*` variables, which the dashboard shell renders itself, so there is no Tailwind scanning to set up. In a Next.js app you list `@n-uf/dynia` and `@n-uf/angiospermae` in `transpilePackages`, because they ship TypeScript source."
  - q: "Can I install dynia today?"
    a: "Not yet. The dynia package is private for now and is not on a public registry. dynia.n-uf.com is built from it, and its library shows the dashboard blocks live: headline numbers, bars and trend, and tables. The code on this page is the components' real API."
sources:
  - title: "dynia library: Headline numbers (dynia.n-uf.com/library/blocks/headline-numbers)"
    url: "https://dynia.n-uf.com/library/blocks/headline-numbers"
    checked: 2026-11-17
    supports: "a few big numbers with a sentence that says what they mean; live samples, props and a usage example"
  - title: "dynia library: Bars and trend (dynia.n-uf.com/library/blocks/charts)"
    url: "https://dynia.n-uf.com/library/blocks/charts"
    checked: 2026-11-17
    supports: "small charts that read at a glance, with their numbers beside them"
  - title: "dynia library: Tables (dynia.n-uf.com/library/blocks/tables)"
    url: "https://dynia.n-uf.com/library/blocks/tables"
    checked: 2026-11-17
    supports: "rows of data with a tag column, in a card with a switch"
  - title: "dynia: Status (dynia.n-uf.com/dossier/status)"
    url: "https://dynia.n-uf.com/dossier/status"
    checked: 2026-11-17
    supports: "where dynia stands: its version and whether you can get it yet"
related:
  - /dynia
  - /dynia/react-stepper-component
actions:
  - heading: "See the headline numbers and tiles on a live page"
    text: "The headline numbers page of dynia's library shows the stat tiles with live samples, their props and a usage example. It is a live demo, and the package is private for now."
    label: "Open the stat tiles demo"
    href: "https://dynia.n-uf.com/library/blocks/headline-numbers"
---
React dashboard components should draw the parts every dashboard has and leave the data alone. dynia's do: a shell with a header and a footer tray, a panel, stat tiles, a written summary, bars and a trend line, a dense table and cards of tagged findings. You compose them and pass in your own numbers. dynia only draws.

This is one of the guides to dynia. dynia is private for now. The package `@n-uf/dynia` is not on a public registry, so you can't install it yet. The code below is its real API, and the [dynia library on dynia.n-uf.com](https://dynia.n-uf.com/library) shows the blocks working.

## Which React dashboard components does dynia have?

The dashboard UI components, with what each one is:

| Block | What it is |
| --- | --- |
| `DyniaDashboard` | The shell: a header with window dots, breadcrumb, pipeline stepper and actions, a word-button nav, the content on a dotted canvas and a footer status tray |
| `DashboardSplit`, `DashboardPanel` | A main column plus a side column that wraps underneath on narrow screens; the raised panel with a mono kicker and a slot for a switch |
| `StatGrid`, `StatTile` | A dense row of headline numbers: label, value and sub-line |
| `Narrative`, `Mark` | The written summary, with values highlighted |
| `BarSeries`, `Sparkline` | Bars with axis labels; a small trend line |
| `DataTable` | A dense table: mono header, zebra rows, right-aligned tabular numbers, a totals row |
| `FindingsCard`, `NotesCard`, `DashboardCard` | Cards with tagged rows: WATCH, TREND, OK |
| `WindowSwitch` | A choice of time window, such as 7D or 30D |

They all import from `@n-uf/dynia`, which exports every layer. A dashboard that needs only some of them can import from the layer entry points, such as `@n-uf/dynia/blocks`.

## How do I put a dashboard together?

Wrap the page in `DyniaDashboard`, put a `DashboardPanel` inside it, and fill the panel with blocks. The shell renders the stylesheet and the `--dy-*` variables for everything inside it, so there's nothing else to import. This example uses plain sample data:

```tsx
import { useState } from "react";
import {
  BarSeries,
  DashboardPanel,
  DataTable,
  DyniaDashboard,
  Mark,
  Narrative,
  StatGrid,
  StatTile,
  WindowSwitch,
} from "@n-uf/dynia";

const weeks = [
  { label: "week of 5 Oct", value: 31, tick: "OCT" },
  { label: "week of 12 Oct", value: 38 },
  { label: "week of 19 Oct", value: 44, partial: true },
];

const pages = [
  { page: "/pricing", views: 1820 },
  { page: "/docs", views: 1210 },
];

export function Overview() {
  const [range, setRange] = useState<"7d" | "30d">("30d");

  return (
    <DyniaDashboard
      heading="Overview"
      breadcrumb={[{ label: "acme", href: "/" }, { label: "overview" }]}
      status={{ comment: "updated 09:12", chip: { label: "1 TO WATCH", tone: "magenta" } }}
    >
      <DashboardPanel
        label="Overview"
        kicker="OVERVIEW"
        actions={
          <WindowSwitch
            options={[{ id: "7d", label: "7D" }, { id: "30d", label: "30D" }]}
            value={range}
            onChange={setRange}
          />
        }
      >
        <Narrative>
          <Mark>38 accounts</Mark> were active and <Mark tone="magenta">nobody signed up</Mark>.
        </Narrative>

        <StatGrid label="Headline numbers">
          <StatTile label="ACTIVE · 30D" value="38" sub="last 30 days" />
          <StatTile label="SIGN-UPS · 30D" value="0" sub="none" tone="magenta" />
        </StatGrid>

        <BarSeries data={weeks} label="Active accounts per week" range="Oct 2026" highlightMax />

        <DataTable
          label="Top pages"
          rows={pages}
          rowKey={(row) => row.page}
          columns={[
            { key: "page", header: "PAGE", rowHeader: true, mono: true, footer: "Total" },
            { key: "views", header: "VIEWS", numeric: true, footer: "3,030" },
          ]}
        />
      </DashboardPanel>
    </DyniaDashboard>
  );
}
```

`heading` gives the page a visually hidden `h1` for screen readers. The numbers and the words in the summary come from your queries and your rules, which is the point: the blocks don't know what a "sign-up" is.

## What do the stat tiles, charts and table do?

`StatTile` takes a `label`, a `value` and an optional `sub` line, and `tone="magenta"` marks a value to watch. A tile can hold more, such as a `Sparkline`, as its children. `StatGrid` lays tiles in a row with hairline dividers and wraps them on narrow screens.

`BarSeries` draws bars with axis labels. A datum has a `label`, a `value` and optionally a `tick` for the axis, `highlight` for a magenta bar, and `partial` for a period that is still running, drawn as an outline. It takes `height`, a shared `scaleMax`, a `formatValue` function and `maxBarWidth`, so one or two bars don't fill the whole chart. `Sparkline` takes `values` and a `label`, and `tone` picks cyan or magenta.

`DataTable` takes `columns`, `rows` and a `rowKey`. A column can be `numeric` (right-aligned, in tabular figures), a `rowHeader`, `mono`, or `wrap`, and can have a `footer` for the totals row. It scrolls sideways on narrow screens.

## Are the dashboard components accessible?

The marks are built to be. `BarSeries` is one `role="img"` with your label and a text alternative that dynia generates from the data: the span, the highest bar and any marked or partial periods. You can replace it with a `description`. `Sparkline` is an image with the label you give it. `StatGrid` is a `<dl>`. The table's scroll region is focusable, so it scrolls from the keyboard.

Small cyan and magenta text uses darker inks than the bright brand colours, so text keeps 4.5:1 contrast.

## Can I use it with my router and my own look?

The shell's `nav` and `breadcrumb` render plain `<a>` links by default. Pass a `linkComponent`, such as the Next.js `Link`, to use your router. A nav item can be `disabled` with a `title`, which shows a section that isn't built yet, muted, and clicking it does nothing.

Corners are square by default. Pass `radius={2}` for the older near-square corners. The styles are self-contained, so there is no Tailwind scanning to set up. In a Next.js app, list `@n-uf/dynia` and `@n-uf/angiospermae` in `transpilePackages`, since the package ships TypeScript source:

```js
// next.config.mjs
export default {
  transpilePackages: ["@n-uf/dynia", "@n-uf/angiospermae"],
};
```

## Are these React admin dashboard components or a template?

No. A template ships pages and data; dynia ships blocks. It has no routing, data fetching or sign-in of its own, and the only chart marks are bars and a sparkline, so a line chart, a pie or a map needs another library. If you were looking for a React analytics dashboard template, dynia gives you the look, the layout and the dense, readable numbers, and you build the pages.

The package is private too, so you can read this page and try the demo, but you can't install it yet. {{live:/dynia/react-stepper-component}}The shell's header can show a pipeline stepper, which has its own guide to a [React stepper component](/dynia/react-stepper-component).{{/live}} The rest of the kit, with a guide per job, is on the [dynia guides](/dynia) page. The sister kits have their own: [harbuz guides](/harbuz) and [kavun guides](/kavun).
