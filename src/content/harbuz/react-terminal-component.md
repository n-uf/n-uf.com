---
title: "React terminal component: xterm.js or a log shell?"
description: "A React terminal component is an emulator like xterm.js or a log shell like harbuz's HarbuzTerminal. Here is how to tell which your app needs."
h1: "React terminal component: an emulator or a log shell?"
mainKeyword: "react terminal component"
kind: comparison
draft: true
published: 2026-12-10
updated: 2026-12-10
author: n-uf
takeaways:
  - "A terminal emulator such as xterm.js runs a real terminal session in the browser: a process writes bytes, the emulator draws the screen, and keystrokes go back to the process."
  - "A log shell such as harbuz's `HarbuzTerminal` draws entries your app already has: rows you render, filtering by point, stats, pause, copy and clear, and no input."
  - "Pick the emulator when people type commands into a running process or when you show output with terminal escape sequences; pick the log shell when you show structured events to read, filter and copy."
  - "The two can sit in one app. They share nothing, and neither replaces the other."
  - "harbuz is private and not installable yet; xterm.js is described here from its own README and pages, fetched on 20 November 2026."
faq:
  - q: "What is the difference between a terminal emulator and a log viewer in React?"
    a: "An emulator reproduces a terminal: it parses the bytes a program writes, draws the screen and sends keystrokes back. A log viewer draws a list of entries that your app already holds as data and lets the reader filter, pause and copy them. An emulator is for a session; a log viewer is for a record."
  - q: "Does xterm.js have a React component?"
    a: "Its README shows a `Terminal` object that you create, open on a DOM element and write to, and it lists no React component. In a React app you create the terminal in an effect, open it on an element you own through a ref, and dispose of it when the component unmounts."
  - q: "Can HarbuzTerminal run commands or take input?"
    a: "No. `HarbuzTerminal` has no input line and no connection to a process. It draws the entries you pass in, newest first, with filtering by point, stats, compact and expanded views, pause, copy and clear. If readers must type commands, use an emulator and a backend process."
  - q: "Can I use xterm.js and harbuz in the same app?"
    a: "Yes. They don't depend on each other. A common split is an emulator for the tab where a person works in a shell, and a log shell for the panel that shows what the app itself did. You style each separately, since xterm.js has its own theming and harbuz follows its eight CSS themes."
  - q: "Does HarbuzTerminal use xterm.js?"
    a: "No. HarbuzTerminal is a log shell written for harbuz: it draws the rows you give it and has no terminal emulation in it. xterm.js is a separate, independent project. harbuz is private for now and not on a public registry, so its Terminal page on harbuz.n-uf.com is the way to see the shell today."
sources:
  - title: "xterm.js README (github.com/xtermjs/xterm.js)"
    url: "https://github.com/xtermjs/xterm.js"
    checked: 2026-11-20
    supports: "xterm.js is a frontend component that brings fully-featured terminals to the browser; works with terminal apps such as bash, vim and tmux; is not a terminal application and not bash; connects to processes through a library such as node-pty; addons; real-world uses"
  - title: "xterm.js home page (xtermjs.org)"
    url: "https://xtermjs.org/"
    checked: 2026-11-20
    supports: "build terminals in the browser; the Terminal object opened on an element and written to; xterm.css; real-world uses"
  - title: "xterm.js API: Terminal class (xtermjs.org/docs/api/terminal/classes/terminal)"
    url: "https://xtermjs.org/docs/api/terminal/classes/terminal/"
    checked: 2026-11-20
    supports: "open(parent), write(data), onData, dispose(); the element must be visible when open is called; onData is meant to be passed to the backing pty"
  - title: "harbuz: Terminal (harbuz.n-uf.com/terminal)"
    url: "https://harbuz.n-uf.com/terminal"
    checked: 2026-11-20
    supports: "HarbuzTerminal is a log shell: the app supplies the entries and a row renderer; filtering by point, stats, compact and expanded views, copy and clear; a live log of the visit"
  - title: "harbuz: home page (harbuz.n-uf.com)"
    url: "https://harbuz.n-uf.com/"
    checked: 2026-11-20
    supports: "HarbuzTerminal is a log shell: you give it entries and a row renderer, and it brings filtering, stats, views, copy and clear; eight CSS-variable themes"
  - title: "harbuz: Install (harbuz.n-uf.com/install)"
    url: "https://harbuz.n-uf.com/install"
    checked: 2026-11-20
    supports: "harbuz's peer dependencies: react, react-dom, lucide-react, react18-json-view, tailwindcss and three Radix UI packages, with no terminal emulator among them"
  - title: "harbuz: Status (harbuz.n-uf.com/status)"
    url: "https://harbuz.n-uf.com/status"
    checked: 2026-11-20
    supports: "not public yet: the package and its sources are private for now"
related:
  - /harbuz
  - /harbuz/react-log-viewer-component
  - /harbuz/react-theme-switcher
actions:
  - heading: "Watch a log shell fill up on a live page"
    text: "The Terminal page on harbuz.n-uf.com is a live log of your own visit: turn pages, pick tools or switch themes and watch it fill. It is a demo only, and the package is private for now."
    label: "Open the live terminal"
    href: "https://harbuz.n-uf.com/terminal"
---
A React terminal component is one of two different things. It can be an emulator, which runs a terminal session in the browser: a program writes bytes, the emulator draws the screen, and keystrokes travel back to the program. Or it can be a log shell, which draws entries your app already has and lets the reader filter, pause and copy them. xterm.js is the first kind and harbuz's `HarbuzTerminal` is the second. Which one you need depends on one question: does someone type into a running process?

harbuz is private for now. The package `@n-uf/harbuz` is not on a public registry, so you can't install it yet. harbuz is independent of xterm.js and of its authors, and none of them endorses it. Everything said here about xterm.js comes from its own README and pages, fetched on 20 November 2026.

## Which React terminal component does your app need?

Ask what the screen is for. If a person works in it, with a prompt, commands and a process that answers, you need an emulator. If a person reads it, with events that already exist as data in your app, you need a log shell.

| | Terminal emulator (xterm.js) | Log shell (HarbuzTerminal) |
| --- | --- | --- |
| What it draws | A terminal screen driven by a program's output | Rows for the entries you pass in |
| Input | Keystrokes, passed on to the process | None |
| What feeds it | A process, usually through a pseudoterminal | An array in your app |
| Terminal programs such as `vim` | Work | Not applicable |
| Structure of a line | Text on a screen | An entry: point, level, tags, a data payload |
| Filter by source | Search is an addon | Built in, by point |
| Pause, copy and clear controls | Not in the README's feature list | Built in |
| Where it stands | Public, shipped through npm | Private, not installable yet |

Neither is better. They answer different questions, and a wrong choice costs more than a missing feature: an emulator for a plain event list is a lot of machinery, and a log shell can't take a command. Five questions settle it:

1. Does anyone type into the screen? If yes, you need an emulator.
2. Is there a process on the other end? A shell, a REPL or a job whose output is a stream of terminal bytes points to an emulator.
3. Do the entries already exist as objects in your app, with a source, a severity and maybe a payload? That points to a log shell.
4. Does the output use colours, a cursor or the whole screen? An emulator draws that. A log shell draws your rows.
5. Will readers filter by where an entry came from, or pause the list to read it? A log shell has both built in.

## What is xterm.js?

xterm.js's README calls it a frontend component that lets applications bring fully-featured terminals to their users in the browser, and says it is used by VS Code, Tabby and Hyper. It works with most terminal apps, `bash`, `vim` and `tmux` among them, including curses-based apps and mouse events. The core library has no dependencies, there is an optional GPU-accelerated renderer, and a screen reader mode can be turned on.

It states what it is not: not a terminal application you download and use, and not `bash`. It can be connected to a process like `bash` through a library such as node-pty, which is how most uses work. The README's example is a `Terminal` object that you open on an element and write to:

```ts
import { Terminal } from "@xterm/xterm";

const term = new Terminal();
term.open(document.getElementById("terminal"));
term.write("Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ");
```

The README also says to include the `xterm.css` file, and shows `pty.onData(data => term.write(data))` and `term.onData(data => pty.write(data))` to connect the two ends. Extras are separate addons, for fitting to an element, search, web links, attaching to a server over a websocket and more. In a React app you create the terminal in an effect, open it on an element you own through a ref, and dispose of it on unmount. The API page says the element must be visible, with dimensions, when `open` is called. A sketch with a websocket standing in for the process (the server side is yours):

```tsx
import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

export function Shell({ socket }: { socket: WebSocket }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = new Terminal();
    term.open(host.current!);

    const onMessage = (event: MessageEvent<string>) => term.write(event.data);
    socket.addEventListener("message", onMessage);
    const typing = term.onData((data) => socket.send(data));

    return () => {
      socket.removeEventListener("message", onMessage);
      typing.dispose();
      term.dispose();
    };
  }, [socket]);

  return <div ref={host} style={{ height: 400 }} />;
}
```

Output goes in with `write` and keystrokes come out through `onData`, which the API page says should be passed on to the backing pty. That loop is the emulator: a process on one end, a person on the other.

## What is HarbuzTerminal?

A log shell. You give it `items`, a `renderItem` function and a `keyExtractor`, and it brings the rest: filtering by point, a sidebar of stats and shortcuts, compact and expanded views, a pause that freezes the list, a copy step and a clear. It draws the newest entry first and follows it. The rows, the data and the meaning of a point are yours.

```tsx
import { HarbuzTerminal, LogEntry, type LogEntryData } from "@n-uf/harbuz";

<HarbuzTerminal<LogEntryData>
  items={entries}
  keyExtractor={(entry) => entry.id}
  renderItem={({ item, index, isExpanded, onToggleExpand }) => (
    <LogEntry entry={item} index={index} isExpanded={isExpanded} onToggleExpand={onToggleExpand} />
  )}
  filtering={{ getPoint: (entry) => entry.point, isEnabled: (point) => point !== "debug" }}
/>;
```

There is no input line and no process behind it. It has no parser for terminal escape sequences either: if your messages carry them, your row renderer has to deal with them. Its rows read the theme's colour variables, so it follows the kit's eight themes. The full walk-through is in the guide to a [React log viewer component](/harbuz/react-log-viewer-component).

## When does xterm.js make more sense?

When the screen is a session. Some signs:

- People type commands, answer prompts or run a REPL in it.
- You show output of a program that uses colours, a cursor or the whole screen, such as a build tool, `htop` or an editor.
- You want the terminal to behave like the one on a developer's machine, including selection, mouse events and Unicode.
- The data is text from a process, and nothing in your app has parsed it into entries.

That last one is not a hard line. xterm.js's own list of uses includes a UI that streams logs over websockets from containers, so raw log output with escape codes is a fair job for an emulator. What it gives you is the screen. What it does not give you is a model of the lines: which source wrote a line, how severe it was and what payload came with it. If you want to filter by those, you parse them yourself first.

## When does a log shell make more sense?

When the screen is a record. The entries exist already, as objects in your app: a sync that pulled 14 changes, a charge that failed with a code, a user who signed in. You want a reader to filter by where an entry came from, freeze the list while they read, expand a row to see its data and hand the lot to a bug report. A log shell fits because it takes the entries as they are. There is nothing to run, nothing to connect and nothing to type.

It also suits a diagnostics panel inside a product: a small, themed window that sits in the interface instead of replacing it. Compact mode folds it to its control strip.

## Can one app use both?

Yes, and some should. The tab where an operator works in a shell is an emulator's job. The panel that shows what the app did on its own is a log shell's. Take an internal tool that runs jobs: a job's live output, with its colours and progress lines, goes to an emulator, while the list of what happened around it (queued, started, retried, failed, with a code) is a set of entries that a log shell can filter by job. They don't share state, and each follows its own styling: xterm.js has its own theming options, and harbuz follows its CSS themes. If the log shell is the one you need, the question of how to style it is covered in the guide to a [React theme switcher component](/harbuz/react-theme-switcher).

## What is HarbuzTerminal not?

It is not a terminal. It runs no commands, reads no input and does not connect to a process. It has no search field or level filter of its own, and it draws what its array holds, so streaming, storing and parsing logs are your app's work. For a real terminal session, use an emulator such as xterm.js.

The package is private too, so you can read this page and try the demo, but you can't install it yet. Every guide to the kit is listed on the [harbuz guides](/harbuz) page. The sister kits have their own: [kavun's guides](/kavun) and [dynia's guides](/dynia). The kit's own site is [harbuz.n-uf.com](https://harbuz.n-uf.com/).
