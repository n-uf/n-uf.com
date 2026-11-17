---
title: "React theme switcher component with 8 CSS themes"
description: "A React theme switcher component: harbuz sets one of eight CSS themes with a data-theme attribute, remembers it and applies it before React hydrates."
h1: "React theme switcher component: eight themes, one attribute"
mainKeyword: "react theme switcher component"
kind: use-case
published: 2026-11-17
updated: 2026-11-17
author: n-uf
takeaways:
  - "harbuz switches themes by changing the `data-theme` attribute on `<html>`; its eight built-in themes are CSS variable sets, so a switch is one attribute change."
  - "`useTheme` returns `theme`, `setTheme` and `themes` and keeps the choice in `localStorage` under `harbuz-theme`; `ocean` is the default."
  - "`ThemeSwitcher` is the ready-made control, in three variants: `grid`, `compact` and `dropdown`."
  - "On a server-rendered page, `getThemeScript` applies the saved theme before React hydrates."
  - "harbuz is private and not installable yet; the code on this page is its real API, and the theme switcher runs live on harbuz.n-uf.com."
faq:
  - q: "How do I switch themes in React without a page reload?"
    a: "Set the `data-theme` attribute on the page's `html` element. harbuz's `setTheme` does that, saves the choice in `localStorage` and updates every component that reads the theme, so nothing reloads. Call `setTheme(\"daylight\")` from your own button, or drop in the `ThemeSwitcher` component, which has the buttons built in."
  - q: "Does harbuz remember the chosen theme?"
    a: "Yes. `useTheme` saves the choice in `localStorage` under the key `harbuz-theme`. On a server-rendered page, `getThemeScript` reads that value before React hydrates and sets `data-theme`, so the saved theme is already on the page when the components render. With nothing saved, the theme is `ocean`."
  - q: "How do I add a dark mode toggle in React with harbuz?"
    a: "Pick one dark and one light theme and call `setTheme` to move between them, for example `midnight` and `daylight`. To follow the visitor's system setting, `useSystemTheme` returns `\"light\"` or `\"dark\"`. harbuz has no single dark-mode flag; each of its eight themes is labelled dark or light."
  - q: "Does the harbuz theme switcher work with Tailwind CSS v4?"
    a: "Yes. harbuz is built for Tailwind v4: you import `@n-uf/harbuz/styles` after `tailwindcss`, which brings the theme variables and utilities such as `bg-bg-primary` and `text-text-primary`. Those utilities read the active theme's CSS variables, so they change with `data-theme` and need no extra Tailwind setup per theme."
  - q: "Can I install harbuz and its theme switcher today?"
    a: "Not yet. The harbuz package is private for now and is not on a public registry. Its Install page shows the planned command, `pnpm add @n-uf/harbuz`. You can use the theme switcher live on harbuz.n-uf.com, where the Themes page restyles the whole dossier around it."
sources:
  - title: "harbuz: Themes (harbuz.n-uf.com/themes)"
    url: "https://harbuz.n-uf.com/themes"
    checked: 2026-11-17
    supports: "eight built-in themes set CSS variables on <html data-theme>, so a switch is one attribute change; useTheme returns theme, setTheme and themes"
  - title: "harbuz: home page and its questions (harbuz.n-uf.com)"
    url: "https://harbuz.n-uf.com/"
    checked: 2026-11-17
    supports: "the eight theme names, ocean as the default, the choice saved in localStorage, the Tailwind v4 stylesheet import and the peer dependencies"
  - title: "harbuz: Install (harbuz.n-uf.com/install)"
    url: "https://harbuz.n-uf.com/install"
    checked: 2026-11-17
    supports: "not on a public registry yet; the planned command pnpm add @n-uf/harbuz; the Tailwind v4 stylesheet imports"
  - title: "harbuz: Status (harbuz.n-uf.com/status)"
    url: "https://harbuz.n-uf.com/status"
    checked: 2026-11-17
    supports: "not public yet: the package and its sources are private for now"
related:
  - /harbuz
  - /harbuz/react-file-explorer-component
actions:
  - heading: "See a React theme switcher change a whole page"
    text: "The Themes page on harbuz.n-uf.com is a live demo: pick one of the eight themes and the dossier around it follows. The package is private for now, so this is a demo only."
    label: "Try the theme switcher live"
    href: "https://harbuz.n-uf.com/themes"
---
A React theme switcher component has three jobs: change which set of CSS variables is active, remember the choice, and apply it before React hydrates so the page doesn't flash the wrong colours. harbuz does all three. Its `ThemeSwitcher` sets the `data-theme` attribute on `<html>` to one of eight built-in themes, saves the choice in `localStorage`, and a small script applies the saved theme before hydration.

This is one of the guides to harbuz. harbuz is private for now. The package `@n-uf/harbuz` is not on a public registry, so you can't install it yet. The code below is its real API, and the [live demo on harbuz.n-uf.com](https://harbuz.n-uf.com/themes) shows it working.

## How does a React theme switcher change the theme?

harbuz has a CSS-variable theme system, so this is a React CSS theme switcher in the plain sense: the colours live in variables, not in components. The active theme is the `data-theme` attribute on `<html>`, so switching is one attribute change: no stylesheet is swapped and nothing is rebuilt. The `useTheme` hook makes the change for you and persists the choice in `localStorage` under the key `harbuz-theme`.

It returns `theme` (the current name), `setTheme` and `themes` (the list of names). Here is a theme switch in React with nothing but a button:

```tsx
import { useTheme } from "@n-uf/harbuz";

function App() {
  const { theme, setTheme, themes } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme("daylight")}>
        Switch to Light
      </button>
    </div>
  );
}
```

`themes` is there for building your own list. The default theme is `ocean`.

## Which themes does harbuz ship?

Eight. The names and metadata are exported as `ThemeName` and `THEME_METADATA`, so a custom theme switcher button can be drawn from the same list. Each theme is filed as dark or light:

| Theme | Category | Look |
| --- | --- | --- |
| `studio` | Dark | Light chrome, dark content (neutral) |
| `ocean` | Dark | Light blue chrome, dark content (the default) |
| `daylight` | Light | All light (bright) |
| `parchment` | Light | All light (warm) |
| `midnight` | Dark | All dark |
| `abyss` | Dark | All blue-dark |
| `deck` | Dark | Black faceplate, hi-fi LCD display panels |
| `alloy` | Light | Brushed-silver faceplate, hi-fi LCD display panels |

A theme here is more than a colour swap. `studio` and `ocean` have light chrome around dark content, and `deck` and `alloy` change the look of the display panels as well as the palette.

## How do I add a React theme switcher component to my app?

Use the `ThemeSwitcher` component. It has three variants: `grid` (the default), `compact` (a row of icon buttons) and `dropdown` (a select). Each is built from the same metadata and calls `setTheme` for you:

```tsx
import { ThemeSwitcher } from "@n-uf/harbuz";

function App() {
  return (
    <div>
      {/* Grid variant (default) */}
      <ThemeSwitcher variant="grid" />

      {/* Compact icon variant */}
      <ThemeSwitcher variant="compact" />

      {/* Dropdown variant */}
      <ThemeSwitcher variant="dropdown" />
    </div>
  );
}
```

Pick `grid` for a settings panel, `compact` for a toolbar and `dropdown` where space is tight. If none of them fits, call `setTheme` from your own markup, as in the first example.

## How do I stop the flash of the wrong theme on a server render?

On a server-rendered or statically generated page, the HTML arrives before React runs. If the theme is applied only in a hook, a visitor who picked `parchment` first sees `ocean` for a moment. `getThemeScript` closes that gap: it returns a small inline script that reads `localStorage` and sets `data-theme` before React hydrates.

It is also exported from `@n-uf/harbuz/hooks/theme-script`, a file with no React imports, so you can use it in a Server Component:

```tsx
import { getThemeScript } from "@n-uf/harbuz/hooks/theme-script";

export default function RootLayout({ children }) {
  return (
    <html data-theme="ocean">
      <head>
        <script dangerouslySetInnerHTML={{ __html: getThemeScript() }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

With nothing saved, the script sets `ocean`. The hook and the script share one storage key, so a theme chosen with `setTheme` is the one the script applies on the next visit.

## How do I build a Tailwind v4 theme switcher with multiple themes?

harbuz is built for Tailwind CSS v4. A Tailwind v4 app imports harbuz's source stylesheet after Tailwind itself. It brings the theme variables, the utility declarations and the source paths for harbuz's components:

```css
@import "tailwindcss";
@import "@n-uf/harbuz/styles";
```

That one import is the whole setup for multiple themes: all eight live in the same stylesheet, keyed by `data-theme`. Your own markup can use harbuz's semantic color utilities, which read the active theme's variables and change with it:

```tsx
<div className="bg-bg-primary text-text-primary border border-border">
  <p className="text-text-muted">Muted text</p>
  <span className="text-success">Success</span>
  <button className="bg-accent text-text-inverse">Accent button</button>
</div>
```

The tokens behind them are plain CSS variables, such as `--color-bg-primary`, `--color-text-primary` and `--color-accent`, so a hand-written rule can use them too.

## How do I make a React dark mode toggle button?

harbuz has no single dark-mode switch, because it has eight themes rather than two modes. A dark mode toggle is a choice of one dark and one light theme. Five of the eight are filed as dark and three as light, so pick the pair that suits your app, for example `midnight` and `daylight`:

```tsx
import { useTheme } from "@n-uf/harbuz";

function DarkModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === "daylight" ? "midnight" : "daylight")}>
      Toggle dark mode
    </button>
  );
}
```

To follow the visitor's system setting instead, `useSystemTheme` returns `"light"` or `"dark"`:

```tsx
import { useSystemTheme, useTheme } from "@n-uf/harbuz";

function FollowSystem() {
  const systemTheme = useSystemTheme(); // "light" | "dark"
  const { setTheme } = useTheme();

  useEffect(() => {
    // Auto-switch to matching theme
    setTheme(systemTheme === "dark" ? "midnight" : "daylight");
  }, [systemTheme, setTheme]);

  return null;
}
```

Run it once near the root of the app, and leave the toggle for visitors who want to override it.

## What does it not do?

This page covers the eight built-in themes and the switch between them. The visitor's choice lives in the browser's `localStorage` under one key, so it is per browser, not per account. And the package is private: you can read this page and try the demo, but you can't install it yet.

{{live:/harbuz/react-file-explorer-component}}A theme switcher is one part of the kit; [a React file explorer component](/harbuz/react-file-explorer-component) is another, and it follows the same themes.{{/live}} The rest of the kit, with a guide per job, is on the [harbuz guides](/harbuz) page. The sister kits have their own: [kavun guides](/kavun) and [dynia guides](/dynia).
