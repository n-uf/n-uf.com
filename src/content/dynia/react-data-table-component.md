---
title: "React data table component without a grid library"
description: "A React data table component for dashboards: dynia's DataTable draws a dense table with a totals row and leaves sorting and paging to you."
h1: "React data table component: a dense table without a grid library"
mainKeyword: "react data table component"
kind: how-to
draft: true
published: 2026-12-06
updated: 2026-12-06
author: n-uf
takeaways:
  - "dynia's `DataTable` is a plain HTML table with a dashboard's look: a mono header, zebra rows, right-aligned tabular numbers, an optional totals row and a caption."
  - "It takes `columns`, `rows`, a `rowKey` and a `label`; a column can be `numeric`, a `rowHeader`, `mono`, `wrap`, have a `footer`, a `width` or a `render` function."
  - "It does not sort, filter, page, select, edit or virtualize: it draws the rows in the order you pass them, so those jobs are yours."
  - "The table is accessible by construction: real `thead`, `tbody` and `tfoot`, `th` cells with a scope, a name from `label`, and a scroll region that takes the keyboard."
  - "dynia is private and not installable yet; its Tables page on dynia.n-uf.com shows a dense table with totals."
faq:
  - q: "Do I need a data grid library for a React data table?"
    a: "Not for a read-only table of a few dozen rows. If you only need aligned numbers, a header, a totals row and sideways scroll, a plain table component is enough. A grid library earns its weight when readers need to sort, filter, select, edit or scroll thousands of rows."
  - q: "How do I sort a table made with dynia's DataTable?"
    a: "Sort the array yourself and pass it in: `DataTable` draws rows in the order it receives them. Keep the sort key in state, sort a copy of your rows, and put a button in a column's `header` to change it. The table does not set `aria-sort`, so say the order in the button's label."
  - q: "How do I show a totals row in a React data table?"
    a: "Give the columns a `footer`. When any column has one, `DataTable` adds a `tfoot` row with a footer cell for every column, bold, with a rule above it. Numeric footers are right-aligned like the numbers above them. The values are yours: dynia does not add up the column for you."
  - q: "Can I put a chart or a link inside a DataTable cell?"
    a: "Yes. A column's `render(row, index)` returns any node, so a cell can hold a link, a chip or dynia's `Sparkline`, a small trend line for table cells. A column that is not a field of your row takes any `key` and must have a `render`; a field column's key is checked against your row type."
  - q: "Can I see dynia's DataTable running with its props?"
    a: "Yes, on the Tables page of dynia's library on dynia.n-uf.com. It shows a dense table with a totals row and a plain table, with live samples, props and code. The package is private for now and is not on a public registry, so that page is the way to see it; you can't install dynia yet."
sources:
  - title: "dynia library: Tables (dynia.n-uf.com/library/blocks/tables)"
    url: "https://dynia.n-uf.com/library/blocks/tables"
    checked: 2026-11-20
    supports: "DataTable, Table, TaggedRows, DashboardCard and WindowSwitch; a dense table with totals and a plain table; rows of data with a tag column, in a card with a switch"
  - title: "dynia: Status (dynia.n-uf.com/dossier/status)"
    url: "https://dynia.n-uf.com/dossier/status"
    checked: 2026-11-20
    supports: "where dynia stands: its version and whether you can get it yet"
related:
  - /dynia
  - /dynia/react-dashboard-components
  - /dynia/react-stepper-component
actions:
  - heading: "See a dense table with a totals row"
    text: "The Tables page in dynia's library shows the dense table with its totals row, a plain table and a tagged list in a card. It is a live demo, and the package is private for now."
    label: "Open the tables demo"
    href: "https://dynia.n-uf.com/library/blocks/tables"
---
A React data table component for a dashboard usually needs less than a grid: a header, rows that are easy to scan, numbers that line up and a totals row. dynia's `DataTable` is that and no more. It is a plain HTML table in the dashboard look, with a mono header, zebra rows, right-aligned tabular numbers, an optional totals row and a scroll region for narrow screens. It does not sort, filter or page. It draws the rows you hand it, in the order you hand them.

dynia is private for now. The package `@n-uf/dynia` is not on a public registry, so you can't install it yet. The code below is its real API, and the [Tables page of dynia's library](https://dynia.n-uf.com/library/blocks/tables) shows the table working.

## Do you need a grid library or a table component?

The question is what the reader does with the table. A table component draws rows. A grid library manages them: it sorts, filters, selects, edits and keeps long lists fast. Most dashboard tables are the first kind, a top-ten list or a small breakdown by team, and a grid is more machinery than they need. Some are the second kind.

| The reader needs to | A table component such as `DataTable` | A grid library |
| --- | --- | --- |
| Read a breakdown of a few dozen rows | Fits | More than needed |
| See aligned numbers and a totals row | Fits | Fits |
| Sort by a column | You sort the array | Built in |
| Filter or search rows | You filter the array | Built in |
| Select rows or edit cells | Not covered | Built in |
| Scroll thousands of rows | Not covered | Built in |

No product is named in that table on purpose: which grid to pick is a separate decision, and `DataTable` makes no claim against any of them. If your table needs the last three rows, you want a grid. If it needs only the first three, read on.

## What does dynia's data table give you?

Everything about the look is fixed, and the markup is the part that is easy to forget:

- a header in the mono face, in capitals;
- zebra rows with hairline dividers;
- numbers right-aligned in tabular figures, so digits line up in a column;
- an optional totals row, set in bold under a rule;
- an optional visible caption above the header;
- real `thead`, `tbody` and `tfoot` elements, with `th` cells that have a scope;
- a scroll region that scrolls sideways on a narrow screen and takes the keyboard.

It is square by default, and its corners follow the `--dy-radius` token. The kit's styles are self-contained, so there is no Tailwind scanning to set up.

## How do I build a React data table component with it?

`DataTable` takes four required props. `columns` describes the columns, `rows` is your array, `rowKey` returns a stable string for a row, and `label` is the accessible name of the table. An optional `caption` adds a visible title above the header:

```tsx
import { DataTable, DyniaStyles, dyniaVars } from "@n-uf/dynia";

type Team = { team: string; accounts: number; reports: number };

const teams: Team[] = [
  { team: "acme", accounts: 12, reports: 1204 },
  { team: "northwind", accounts: 4, reports: 87 },
];

const fmt = (n: number) => n.toLocaleString("en-US");
const sum = (pick: (team: Team) => number) => fmt(teams.reduce((total, team) => total + pick(team), 0));

export function TeamsTable() {
  return (
    <div className="dy-canvas" style={dyniaVars()}>
      <DyniaStyles />
      <DataTable
        label="Teams by reports, all time"
        caption="TEAMS · ALL TIME"
        rows={teams}
        rowKey={(row) => row.team}
        columns={[
          { key: "team", header: "Team", rowHeader: true, footer: "Total" },
          { key: "accounts", header: "Accounts", numeric: true, footer: sum((team) => team.accounts) },
          { key: "reports", header: "Reports", numeric: true, render: (row) => fmt(row.reports), footer: sum((team) => team.reports) },
        ]}
      />
    </div>
  );
}
```

The wrapper with `DyniaStyles` and `dyniaVars()` is only for a table on its own. Inside a `DyniaDashboard`, the shell renders the stylesheet and the variables for everything in it, which is how the [React dashboard components](/dynia/react-dashboard-components) use the same table next to stat tiles and bars.

## What can a column do?

A column is an object. Two things are required, `key` and `header`; the rest are options:

| Option | What it does |
| --- | --- |
| `key` | A field of your row, checked against your row type, or any string for a computed column |
| `header` | The header cell's content: text, or any node |
| `numeric` | Right-aligns the column and sets tabular figures |
| `rowHeader` | Makes each cell of the column a `th scope="row"`, usually the first column |
| `footer` | The totals-row cell for this column |
| `width` | A width in pixels or any CSS length |
| `mono` | The mono face, for identifiers |
| `wrap` | Lets long text wrap onto several lines instead of widening the table |
| `render` | Draws the cell from `(row, index)`; required when the key is not a field of the row |

A typo in `key` is a compile error when the column is a field of your row type, which is the point of making the table generic. A computed column, such as a trend, takes a made-up key and a `render`.

## How do I format numbers and add a trend line?

The table shows a cell's value as it is, so format it in `render`. The `fmt` above adds thousands separators; use `Intl.NumberFormat` for currency or percentages. A column that needs a chart takes dynia's `Sparkline`, a small trend line for table cells. Here each row has a `trend` array of numbers:

```tsx
import { Sparkline } from "@n-uf/dynia";

{
  key: "trend",
  header: "Last 7 weeks",
  render: (row) => (
    <Sparkline values={row.trend} label={`${row.team}, reports per week: ${row.trend.join(", ")}`} width={84} height={18} />
  ),
}
```

The `Sparkline` is an image with the label you give it, so a screen reader hears the numbers as well.

## How do I sort, filter and page a React data table?

You do it before the table sees the rows. `DataTable` draws `rows` in order and has no notion of a sort. Keep the sort key and direction in state, sort a copy of your array, and pass that in. The header of a column is any node, so a button in it can change the sort:

```tsx
const [sort, setSort] = useState<"team" | "reports">("reports");
const sorted = [...teams].sort((a, b) => (sort === "team" ? a.team.localeCompare(b.team) : b.reports - a.reports));

// in the columns:
{ key: "reports", header: <button type="button" onClick={() => setSort("reports")}>Reports, largest first</button>, numeric: true }
```

Filtering is the same, and so is paging: slice the array and render the page you want. The table does not set `aria-sort` on a header cell, so say the order in the button's label, as above. If you find yourself writing sort, filter, paging and selection together, that is the sign you wanted a grid library.

## Is the table accessible, and how does it behave on a phone?

The table is a real `table`, with a `th scope="col"` for each header and a `th scope="row"` for each cell of a `rowHeader` column. `label` is its accessible name. With a `caption`, the caption is the table's visible name too. The wrapper is a region with the same label and `tabIndex` 0, so a keyboard user can focus it and scroll it sideways with the arrow keys.

On a narrow screen the table keeps its columns and scrolls inside the wrapper instead of squeezing them. Cells do not wrap by default; a column marked `wrap` does, which suits a long description. With no rows, the table shows one line, `// no rows`, and `empty` replaces it with your own node.

## How do I keep a dense table readable?

A dense table works because it is regular, so most of the care is in what you put into it, not in the component:

- Keep the first column a name and make it the `rowHeader`, so each row reads as "this team: these numbers".
- Put the unit in the header, "Reports, 30 days", and keep the cells bare numbers. Right alignment and tabular figures only help when every cell in a column has the same shape.
- Format with the same `fmt` in the cell and in the footer, or the totals row will not line up with the rows above it.
- Keep it to what fits a phone-width scroll comfortably: a handful of columns. A table of twenty columns is a spreadsheet, and a table component doesn't make it readable.
- Put the biggest or most urgent rows first, by sorting before you pass the rows in. The zebra stripes help the eye follow a row; they don't rank anything.

If a column holds a status, a short chip from the kit's primitives reads faster than a sentence. `Chip` and `Tag` are in `@n-uf/dynia/primitives`, and a `render` function can return one.

## What if I need to write the rows myself?

`DataTable` is built on a lower-level `Table` primitive: the same wrapper, with a `label` and a `caption`, around the `thead`, `tbody` and `tfoot` you write yourself. Use it when a row needs something the column model can't express, such as a cell that spans columns or a row that holds a form. The zebra rows, the alignment through `data-numeric` and the scroll region come with it.

## What is DataTable not?

It is not a grid. There is no sorting, filtering, paging, row selection, cell editing, column resizing, sticky header or virtual scrolling in it, and no way to ask it for any of them. The totals are yours too: dynia does not add up a column.

The package is private as well, so you can read this page and try the demo, but you can't install it yet. {{live:/dynia/react-stepper-component}}Another part of the kit that is easy to mistake for a library job is a pipeline stepper, which has its own guide to a [React stepper component](/dynia/react-stepper-component).{{/live}} Every guide to the kit is listed on the [dynia guides](/dynia) page. The sister kits have their own: [guides to harbuz's themes and shells](/harbuz) and [guides to kavun's PDF viewer parts](/kavun). The kit's own site is [dynia.n-uf.com](https://dynia.n-uf.com/).
