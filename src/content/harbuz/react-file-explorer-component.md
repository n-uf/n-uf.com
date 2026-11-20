---
title: "React file explorer component with list and grid views"
description: "A React file explorer component: harbuz's FileExplorer gives you breadcrumbs, list and grid views and sorting over a flat list of files you supply."
h1: "React file explorer component: a file manager shell for your data"
mainKeyword: "react file explorer component"
kind: use-case
draft: false
published: 2026-11-20
updated: 2026-11-20
author: n-uf
takeaways:
  - "`FileExplorer` is a shell: you pass it a flat list of `FileItem` objects (folders by `parentId`) and it draws the breadcrumb, toolbar, list or grid and a status bar."
  - "`useFileExplorer` keeps the state for you: the current folder, selection, view mode, sort and back and forward history."
  - "Sorting covers name, size, modified date and type; with a sort set, folders are listed before files."
  - "It reads no disk and uploads nothing; opening, renaming or deleting a file is your code, through `onItemOpen`, `onContextMenu` and `toolbarActions`."
  - "harbuz is private and not installable yet, and the file explorer has no live demo page on harbuz.n-uf.com."
faq:
  - q: "What data does a React file explorer component need?"
    a: "A flat array of `FileItem` objects. Each has an `id`, a `name`, `isDirectory` and a `parentId`, which is `null` for items at the root. `size`, `modifiedAt` and `createdAt` are optional. harbuz's `useFileExplorer` filters that array down to the current folder and builds the breadcrumb for you."
  - q: "Is harbuz's FileExplorer a real file manager?"
    a: "No, it is a file manager shell. It draws the browsing interface, but it reads no filesystem and does no uploads, renames or deletes. Your app owns the data and decides what opening a file means through `onItemOpen`. You can add your own commands through `toolbarActions` and a context menu through `onContextMenu`."
  - q: "Can the React file explorer show a grid as well as a list?"
    a: "Yes. `viewMode` takes `\"list\"` or `\"grid\"`, and the toolbar has a toggle for it. In grid view, `gridSize` takes `\"sm\"`, `\"md\"` or `\"lg\"`. In list view, `showDetails` controls whether the file details are shown. With `useFileExplorer` the starting view is `initialViewMode`."
  - q: "How do I sort files in the React file explorer?"
    a: "Pass `sortConfig` with a `field` (`\"name\"`, `\"size\"`, `\"modifiedAt\"` or `\"type\"`) and a `direction` (`\"asc\"` or `\"desc\"`). The toolbar has Name, Date and Size buttons that call `onSortChange`. With a sort set, folders are listed before files, whatever the field, and `type` compares file extensions."
  - q: "Is there a live demo of the harbuz file explorer?"
    a: "Not yet. harbuz.n-uf.com is built from harbuz and shows its dossier, terminal and themes live, but `FileExplorer` has no demo page there. The package is private for now and not on a public registry, so you can't install it yet either. The code on this page is the component's real API."
sources:
  - title: "harbuz: home page (harbuz.n-uf.com)"
    url: "https://harbuz.n-uf.com/"
    checked: 2026-11-17
    supports: "harbuz is a React UI kit of primitives, blocks and shells for dossiers, terminals and explorers; built with React 19, TypeScript, Tailwind CSS v4 and Radix UI; not on a public registry yet"
  - title: "harbuz: The dossier (harbuz.n-uf.com/dossier)"
    url: "https://harbuz.n-uf.com/dossier"
    checked: 2026-11-17
    supports: "the dossier's zones, including a side panel with an explorer; no page for the file explorer itself"
  - title: "harbuz: Status (harbuz.n-uf.com/status)"
    url: "https://harbuz.n-uf.com/status"
    checked: 2026-11-17
    supports: "not public yet: the package and its sources are private for now"
related:
  - /harbuz
  - /harbuz/react-theme-switcher
actions:
  - heading: "See the kit this file explorer comes from, live"
    text: "harbuz.n-uf.com runs on harbuz itself: its dossier, terminal and eight themes. FileExplorer has no demo there yet, and the package is private for now."
    label: "Open harbuz.n-uf.com"
    href: "https://harbuz.n-uf.com/"
---
A React file explorer component draws the browsing part of a file manager: a list of files and folders, a breadcrumb, back and forward buttons, a list or grid view and sorting. harbuz's `FileExplorer` does that over a flat list of items you give it. It is a file manager shell, not a filesystem: it reads no disk, uploads nothing and renames nothing, and your app decides what every item means.

harbuz is private for now. The package `@n-uf/harbuz` is not on a public registry, so you can't install it yet. The code below is the component's real API; the kit itself runs live on [harbuz.n-uf.com](https://harbuz.n-uf.com/), though its file explorer has no demo page there yet.

## What does a React file explorer component need from you?

One flat array. Each entry is a `FileItem`:

- `id`: a unique identifier.
- `name`: the file or folder name.
- `isDirectory`: whether it is a folder.
- `parentId`: the `id` of the folder it sits in, or `null` for items at the root.
- `size`, `modifiedAt` and `createdAt`: optional, for the details and the sort.
- `metadata`: an optional record for your own data.

Folders are not nested objects. The tree is made of `parentId` links, which is what most APIs and databases give you already, so mapping your own data in is one `map` call.

## How do I build a React file manager component with it?

`FileExplorer` is a controlled component: it draws what you pass in and reports what the visitor does. Keeping the state yourself works, but harbuz ships a hook that does it. `useFileExplorer` takes the whole flat list, tracks the current folder, selection, view mode, sort and back and forward history, and returns the pieces `FileExplorer` wants:

```tsx
import { FileExplorer, useFileExplorer, type FileItem } from "@n-uf/harbuz";

const files: FileItem[] = [
  { id: "docs", name: "Documents", isDirectory: true, parentId: null },
  { id: "plan", name: "plan.pdf", isDirectory: false, size: 48210, modifiedAt: new Date("2026-10-02"), parentId: "docs" },
  { id: "notes", name: "notes.txt", isDirectory: false, size: 1200, parentId: null },
];

function Files() {
  const {
    state,
    actions,
    currentFiles,
    breadcrumb,
    canGoBack,
    canGoForward,
    handleItemClick,
    handleItemDoubleClick,
  } = useFileExplorer({
    files,
    initialPath: null,
    initialViewMode: "list",
    initialSortConfig: { field: "name", direction: "asc" },
    onFileOpen: (file) => console.log("Open:", file.name),
  });

  return (
    <FileExplorer
      items={currentFiles}
      selectedIds={state.selectedIds}
      breadcrumb={breadcrumb}
      viewMode={state.viewMode}
      sortConfig={state.sortConfig}
      onViewModeChange={actions.setViewMode}
      onSortChange={actions.setSort}
      onItemSelect={handleItemClick}
      onItemOpen={handleItemDoubleClick}
      onBreadcrumbNavigate={(item) => actions.navigateTo(item.id === "root" ? null : item.id)}
      showBack={canGoBack}
      onBack={actions.goBack}
      showForward={canGoForward}
      onForward={actions.goForward}
    />
  );
}
```

A click selects an item. A double-click on a folder goes into it, and on a file it calls your `onFileOpen`. The breadcrumb starts at "Home", which has the id `root`, and `navigateTo(null)` is the way back to the root.

## What does the file browser show?

Four parts, top to bottom:

- **Toolbar.** Back and forward buttons, sort buttons (Name, Date, Size), a list and grid toggle, and a slot for your own buttons, `toolbarActions`.
- **Breadcrumb.** The path from the root to the current folder; each segment calls `onBreadcrumbNavigate`.
- **The list.** The items in list or grid view; with a sort set, folders come first.
- **Status bar.** The number of items, the number selected, and a loading note while `isLoading` is true.

An optional `title` adds a title bar above the toolbar. When the folder is empty, the list shows `emptyState`, which is any node you pass.

## How do list and grid views and sorting work?

`viewMode` is `"list"` or `"grid"`. In list view `showDetails` turns the file details on or off; in grid view `gridSize` is `"sm"`, `"md"` or `"lg"`. The sort is a `sortConfig` with a `field` and a `direction`:

| Option | Values |
| --- | --- |
| `viewMode` | `"list"`, `"grid"` |
| `gridSize` | `"sm"`, `"md"`, `"lg"` |
| `sortConfig.field` | `"name"`, `"size"`, `"modifiedAt"`, `"type"` |
| `sortConfig.direction` | `"asc"`, `"desc"` |

With a `sortConfig` set, folders come before files, whichever field you sort by. `type` compares file extensions. With `useFileExplorer`, `actions.setSort(field)` sorts ascending on a new field and flips the direction when you pick the same field again.

## Can the explorer be a resizable window?

Yes. Add `resizable` and the explorer draws inside a window that can be resized from its edges. `initialWidth` and `initialHeight` set the start size (500 by 400 by default), `minWidth`, `maxWidth`, `minHeight` and `maxHeight` set the limits, `resizeEdges` picks which edges can be dragged, and `onSizeChange(width, height)` reports the new size:

```tsx
<FileExplorer
  items={currentFiles}
  resizable
  initialWidth={500}
  initialHeight={400}
  onSizeChange={(width, height) => console.log(width, height)}
/>
```

That makes the file explorer UI fit a canvas-like app, where the explorer is one of several panels the visitor arranges. `showShadow` and `borderRadius` style the window.

## Does it follow the theme?

The explorer draws with harbuz's theme variables, so it takes the active theme's colours: background, chrome, borders and text. Switch the theme and the explorer follows, with no props to change. How the themes work is the subject of the guide to a [React theme switcher component](/harbuz/react-theme-switcher).

## What is it not?

The props above are all the explorer exposes. There is nothing in them for uploading, renaming, deleting or reading a real filesystem. Those belong to your app: handle `onItemOpen` and `onContextMenu(item, event)`, and put your own buttons in `toolbarActions`. If you need a file manager that talks to a disk or a cloud store, you write that layer and feed its results in as `FileItem`s.

The package is also private, so you can read this page but can't install it yet. Every guide to the kit is listed on the [harbuz guides](/harbuz) page. The sister kits have their own: [kavun's guides](/kavun) and [dynia's guides](/dynia).
