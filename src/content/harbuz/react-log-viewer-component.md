---
title: "React log viewer component with filters and stats"
description: "A React log viewer component: harbuz's HarbuzTerminal filters entries by point, shows stats, has compact and expanded views, and pauses and clears."
h1: "React log viewer component: filter, pause and copy your logs"
mainKeyword: "react log viewer component"
kind: use-case
draft: true
published: 2026-12-02
updated: 2026-12-02
author: n-uf
takeaways:
  - "`HarbuzTerminal` is a log shell: you pass `items`, a `renderItem` function and a `keyExtractor`, and it brings filtering by point, a stats sidebar, compact and expanded views, pause, copy and clear."
  - "Filtering is by point: `filtering.getPoint` names the point of an entry, `isEnabled` says whether it is on, and `debugPoints` draws the toggles. The state of the toggles is yours."
  - "The list is newest first. Scroll away from the top and the terminal freezes a snapshot; pause freezes it on purpose; clear takes one press while following and two while frozen."
  - "`LogEntry` is the ready-made row: timestamp, point, level (`info`, `warn`, `error`), tags and an expandable `data` payload."
  - "harbuz is private and not installable yet; the terminal runs live on harbuz.n-uf.com."
faq:
  - q: "How do I filter logs in a React log viewer?"
    a: "Give `HarbuzTerminal` a `filtering` object with `getPoint`, which returns the point of an entry, and `isEnabled`, which says whether that point is on. Entries from points that are off are not drawn. `alwaysInclude` lists points that stay visible whatever `isEnabled` says."
  - q: "Does the harbuz log viewer show new entries as they arrive?"
    a: "Yes. The terminal follows the top of the list, where the newest entry sits, and scrolls back there when `items` grows. If the reader scrolls away, it freezes a snapshot and shows a banner instead of moving the rows. Pause does the same on purpose. Both are lifted with one click."
  - q: "Can the React log viewer read logs from a server or a file?"
    a: "No. `HarbuzTerminal` draws an array you pass in and keeps no connection of its own. Your app fetches, streams or parses the logs and hands it the entries. Mapping them to `LogEntryData`, or to your own type with your own `renderItem`, is the whole contract."
  - q: "Can I change how a log row looks?"
    a: "Yes. `HarbuzTerminal` is generic over your entry type, and `renderItem` returns any node, so a row can be `LogEntry`, a component of your own, or `LogEntry` with its `colors`. The row receives `item`, `index`, `isExpanded` and `onToggleExpand` for the open and closed state."
  - q: "Where can I try the harbuz log viewer today?"
    a: "On the Terminal page of harbuz.n-uf.com, which shows a live log of your own visit: turn pages, pick tools or switch themes and it fills. The package is private for now and not on a public registry, so the demo is the only way to try it today."
sources:
  - title: "harbuz: Terminal (harbuz.n-uf.com/terminal)"
    url: "https://harbuz.n-uf.com/terminal"
    checked: 2026-11-20
    supports: "a log shell: the app supplies the entries and a row renderer; filtering by point, stats, compact and expanded views, copy and clear; the HarbuzTerminal props in the example; a live log of the visit"
  - title: "harbuz: home page (harbuz.n-uf.com)"
    url: "https://harbuz.n-uf.com/"
    checked: 2026-11-20
    supports: "HarbuzTerminal is a log shell: you give it entries and a row renderer, and it brings filtering, stats, views, copy and clear; built with React 19, TypeScript, Tailwind CSS v4 and Radix UI"
  - title: "harbuz: Status (harbuz.n-uf.com/status)"
    url: "https://harbuz.n-uf.com/status"
    checked: 2026-11-20
    supports: "not public yet: the package and its sources are private for now"
related:
  - /harbuz
  - /harbuz/react-terminal-component
  - /harbuz/react-theme-switcher
actions:
  - heading: "Watch a log viewer fill up as you use a page"
    text: "The Terminal page on harbuz.n-uf.com is a live log of your own visit: turn pages, pick tools or switch themes and watch it fill. It is a demo only, and the package is private for now."
    label: "Open the live terminal"
    href: "https://harbuz.n-uf.com/terminal"
---
A React log viewer component draws a list of entries and lets the reader narrow it down, freeze it, copy it and clear it. harbuz's `HarbuzTerminal` does that over an array you pass in. It filters by point, shows stats beside the list, switches between compact and expanded views, and pauses, copies and clears. It reads no files and opens no connection: your app owns the logs, and the terminal only draws them.

harbuz is private for now. The package `@n-uf/harbuz` is not on a public registry, so you can't install it yet. The code below is its real API, and the [live terminal on harbuz.n-uf.com](https://harbuz.n-uf.com/terminal) shows a log of your own visit filling up.

## What does a React log viewer component need to do?

A few jobs come up in every log panel. Show the newest entry first. Let the reader hide the noisy sources. Stop the list from moving while they read. Hand the lines to a bug report. Throw everything away when it is stale.

`HarbuzTerminal` covers those and nothing else. It is a shell: a window with a header, a log body, a sidebar of stats and shortcuts, and a control panel with a small display. The rows, the data and the meaning of a point are yours. The three props every use needs are:

- `items`: the entries to show, newest first.
- `renderItem`: a function that draws one entry.
- `keyExtractor`: a stable key for each entry.

## How do I show log entries in a React log viewer?

harbuz ships a row for this, `LogEntry`, and a type for what it takes, `LogEntryData`. An entry has a numeric `id`, a `timestamp` string, a `point` (the name of the source), a `message`, and optionally a `level` of `info`, `warn` or `error`, `tags`, a `pointEmoji`, a `frequencyBadge` and a `data` payload of any shape.

```tsx
import { HarbuzTerminal, LogEntry, type LogEntryData } from "@n-uf/harbuz";

const entries: LogEntryData[] = [
  { id: 3, timestamp: "09:41:07", point: "billing", level: "error", message: "Charge failed", data: { code: "card_declined" } },
  { id: 2, timestamp: "09:41:02", point: "sync", message: "Pulled 14 changes" },
  { id: 1, timestamp: "09:40:58", point: "auth", message: "Signed in" },
];

export function Logs() {
  return (
    <HarbuzTerminal<LogEntryData>
      items={entries}
      keyExtractor={(entry) => entry.id}
      renderItem={({ item, index, isExpanded, onToggleExpand }) => (
        <LogEntry entry={item} index={index} isExpanded={isExpanded} onToggleExpand={onToggleExpand} />
      )}
    />
  );
}
```

The newest entry comes first in the array, because the terminal follows the top of the list. A row with a `data` payload has an arrow and opens on click to show the payload; `isExpanded` and `onToggleExpand` carry that state, which the terminal keeps for you. The `level` sets the left border and a faint tint: muted for `info`, and the theme's warning and error colours for the others.

You don't have to use `LogEntry`. `renderItem` returns any node, so a row can be a component of your own over your own entry type.

## What do tags, levels and data payloads add?

`tags` draw as small pills in the row. `LogEntry` takes an `onTagClick` handler and an `activeTags` set, so a click on a tag can feed a tag filter of your own and the chosen tags stay highlighted in the rows. A `frequencyBadge`, such as `"FREQUENT"`, is a short label for entries that repeat.

While a row is closed, a short preview of its `data` sits at the end of the line; open it and the payload shows under the row as an interactive JSON tree. When the payload has a `from` and a `to`, directly or on one of its properties, the row opens a change view instead, which suits a log of settings that changed. The row's `colors` prop overrides the muted, message and secondary text colours; by default they follow the theme.

## How do I filter logs by point in a React log viewer?

A point is the name of where an entry came from: a module, a feature, a job. The filter is two functions and a list of toggles. `filtering.getPoint` reads the point from an entry, and `filtering.isEnabled` says whether that point is on. The terminal draws the entries whose point is on and leaves the rest out.

The toggles themselves are `debugPoints`: one small indicator button per point, with a `label`, a `variant` (`success`, `warning`, `error` or `info`), an `active` flag and an `onClick`. The terminal draws them in its control panel. Which points are on is your state:

```tsx
import { useState } from "react";
import { HarbuzTerminal, LogEntry, type LogEntryData } from "@n-uf/harbuz";

const POINTS = ["auth", "sync", "billing"];

export function FilteredLogs({ entries, onClear }: { entries: LogEntryData[]; onClear: () => void }) {
  const [on, setOn] = useState<Set<string>>(new Set(POINTS));

  const toggle = (point: string) =>
    setOn((prev) => {
      const next = new Set(prev);
      if (next.has(point)) next.delete(point);
      else next.add(point);
      return next;
    });

  return (
    <HarbuzTerminal<LogEntryData>
      items={entries}
      keyExtractor={(entry) => entry.id}
      renderItem={({ item, index, isExpanded, onToggleExpand }) => (
        <LogEntry entry={item} index={index} isExpanded={isExpanded} onToggleExpand={onToggleExpand} />
      )}
      filtering={{
        getPoint: (entry) => entry.point,
        isEnabled: (point) => on.has(point),
        alwaysInclude: ["health"],
      }}
      debugPoints={POINTS.map((point) => ({
        label: point,
        variant: "info" as const,
        active: on.has(point),
        onClick: () => toggle(point),
      }))}
      onClear={onClear}
    />
  );
}
```

`alwaysInclude` names points that stay visible whatever `isEnabled` says, such as a heartbeat you never want to lose. This is the filter's whole scope: it works on points. HarbuzTerminal has no search field or level filter of its own, so a filter by text or by `level` is yours to apply to `items` before you pass them in.

## What are the stats, shortcuts and view modes?

The sidebar has three parts. `stats` is a list of `{ label, value, color }` items, such as the count of entries and of errors; you work them out and the sidebar shows them. `shortcuts` lists keyboard shortcuts, each with the keys to show, a description, the `key` to listen for, `ctrl` or `meta`, and a handler. Without your own list the terminal sets three: Ctrl+D switches between compact and expanded, Ctrl+K clears the logs, and Esc closes the panel. The sidebar also holds quick-resize buttons, `resizePresets`, which default to 0, 200, 300, 400, 600 and 800 pixels.

The two views are `"expanded"` and `"compact"`, set at the start with `initialViewMode`. Expanded draws the header, the log body and the sidebar. Compact leaves only the control panel: the point toggles and the small display that shows messages such as "Log rendering paused". Ctrl+D or the display's arrow switches between them, and Esc or the close button hides the panel behind a "Show Panel" button.

The body is 600 pixels tall unless you pass `initialHeight`, and the header carries a handle to resize it. `minHeight` and `maxHeight` set the limits.

## How do pause, follow and clear work?

New entries go to the top, and the terminal scrolls back to the top as they arrive. That is following. Scroll a few rows down and it stops, takes a snapshot of the list and shows a banner, "Viewing snapshot at N logs - Click to return to live stream". Scroll back up, click the banner or press the button with the up arrow, and it follows again.

Pause is the same freeze, chosen by hand. While paused, the list shows the entries as they were when you pressed pause, and the banner reads "Log rendering paused - N logs frozen". Pressing the button or clicking the banner resumes.

Clear calls your `onClear` handler; the terminal doesn't own the array, so you empty it. While following, one press clears. While paused or on a snapshot it takes two: the first press calls `onClear`, and the second, within three seconds, drops the snapshot and goes back to following.

Copy is the fourth button. It steps through two states, and the shell reports the entries through `onCopy(items)`. Putting them on the clipboard, in whatever text format you want, is in your handler.

## Does it follow the theme?

Yes. The rows read the theme's colour variables, so a log viewer drawn on `parchment` looks different from one on `midnight` without a prop. How themes work is the subject of the guide to a [React theme switcher component](/harbuz/react-theme-switcher).

## What is it not?

It is not a log pipeline. It does not fetch, stream, store or parse logs, and it has no text search. It is also not a shell in the Unix sense: nothing in it takes input or runs commands. {{live:/harbuz/react-terminal-component}}If what you want is a place to type commands, a different tool does that, and the guide to a [React terminal component](/harbuz/react-terminal-component) sets the two side by side.{{/live}}

The package is private, so you can read this page and try the demo, but you can't install it yet. Every guide to the kit is listed on the [harbuz guides](/harbuz) page. The sister kits have their own: [kavun's guides](/kavun) and [dynia's guides](/dynia).
