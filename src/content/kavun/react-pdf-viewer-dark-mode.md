---
title: "React PDF viewer dark mode: five themes in kavun"
description: "React PDF viewer dark mode with kavun: five dossier themes the viewer picks and kavun remembers, and how to set or follow the theme from your own code."
h1: "React PDF viewer dark mode: five themes, remembered per viewer"
mainKeyword: "react pdf viewer dark mode"
kind: use-case
draft: true
published: 2026-11-25
updated: 2026-11-25
author: n-uf
takeaways:
  - "kavun's dossier has five themes, Surface, Panel, Dark, Paper and Contrast; the viewer picks one inside it and kavun remembers the choice per viewer."
  - "The theme dresses kavun's own parts. kavun draws no PDF pages, so how a page looks in dark mode is up to your renderer."
  - "`defaultTheme` sets the first theme, and `theme` with `onThemeChange` lets your app control it; Panel's value is `\"light\"`."
  - "Your `renderPage` is not handed the theme, so keep it in your own state if your pages should follow it."
  - "The package is private and not installable yet; the five themes run live on kavun.n-uf.com."
faq:
  - q: "Does kavun have a dark mode for a React PDF viewer?"
    a: "Yes. The dossier has five themes, and Dark is one of them: the panel at night. The others are Surface, Panel, Paper and Contrast. The viewer chooses a theme inside the dossier, and kavun remembers the choice per viewer. Your app can also set or control the theme with props."
  - q: "How do I make the dark theme the default?"
    a: "Pass `defaultTheme=\"dark\"` to `KavunDossier`. It is the theme used until the viewer chooses one; without it the default is `\"surface\"`. If you want your app to own the choice instead, pass `theme` and handle `onThemeChange`, and the viewer's pick will come to your code."
  - q: "Does the dark theme change the PDF pages themselves?"
    a: "No. kavun draws no PDF pages, so the theme dresses kavun's own parts, such as the header, deck, rail and drawers. Your renderer draws each page. `renderPage` is not given the theme, so keep it in your own state through `onThemeChange` if your pages should change with it."
  - q: "Is the viewer's theme choice remembered?"
    a: "Yes, per viewer. kavun stores it in `localStorage` under the key `kavun-dossier-theme` by default. Pass your own key as `themeStorageKey`, or `null` to remember nothing, in which case the dossier starts from `defaultTheme` on every load. A controlled `theme` prop takes over from the stored one."
  - q: "Where can I try kavun's five themes before it is public?"
    a: "On kavun.n-uf.com. The site is built from kavun, and its library's Themes page shows Surface, Panel, Dark, Paper and Contrast live, so you can compare them in the browser. The package itself is private for now and not on a public registry, so you can't install it yet. The code on this page is its real API."
sources:
  - title: "kavun library: Themes (kavun.n-uf.com/library/foundations/themes)"
    url: "https://kavun.n-uf.com/library/foundations/themes"
    checked: 2026-11-17
    supports: "Surface, Panel, Dark, Paper and Contrast: the panel's colours as tokens, one set per theme"
  - title: "kavun library: Theme Panel (kavun.n-uf.com/library/chrome/theme-panel)"
    url: "https://kavun.n-uf.com/library/chrome/theme-panel"
    checked: 2026-11-17
    supports: "a slim side panel with one card per theme and a live miniature of each"
  - title: "kavun: home page (kavun.n-uf.com)"
    url: "https://kavun.n-uf.com/"
    checked: 2026-11-17
    supports: "Theme in the window handle's menu picks one of five themes, and every open dossier follows it; the themes run from the surface grey to paper and high contrast"
  - title: "kavun: Status (kavun.n-uf.com/status)"
    url: "https://kavun.n-uf.com/status"
    checked: 2026-11-17
    supports: "not public yet: the package and its sources are private for now"
related:
  - /kavun
  - /kavun/react-pdf-viewer-custom-toolbar
actions:
  - heading: "See all five kavun themes live"
    text: "The themes page of the kavun library shows Surface, Panel, Dark, Paper and Contrast as live samples. It is a live demo, and the package is private for now."
    label: "Try the five kavun themes"
    href: "https://kavun.n-uf.com/library/foundations/themes"
---
In kavun, React PDF viewer dark mode is one of five themes for the viewer's interface: Surface, Panel, Dark, Paper and Contrast. The viewer picks one inside the dossier, and kavun remembers it per viewer. kavun draws no PDF pages, so the pages themselves come from your renderer; the theme dresses the parts kavun draws around them.

kavun is private for now. The package `@n-uf/kavun` is not on a public registry, so you can't install it yet. The code below is its real API, and the [five themes on kavun.n-uf.com](https://kavun.n-uf.com/library/foundations/themes) run live.

## What does React PDF viewer dark mode mean in kavun?

Not one switch, but one of five themes. kavun's `KAVUN_THEMES` lists them with a label, a description and a category:

| Theme | `theme` value | Description | Category |
| --- | --- | --- | --- |
| Surface | `"surface"` | The workspace grey, like the explorer | light |
| Panel | `"light"` | A light instrument panel | light |
| Dark | `"dark"` | The panel at night | dark |
| Paper | `"paper"` | Warm, for long reading | light |
| Contrast | `"contrast"` | Maximum legibility | light |

Note that Panel's value is `"light"`, while its label is Panel. The type of a value is `KavunThemeName`. Dark is the only one filed as dark; Paper is the one for long reading, and Contrast is the one for legibility.

## How does the viewer switch themes?

Inside the dossier. The window handle's menu, which opens on a right-click on the ⠿ handle, has a Theme row that opens the theme drawer. The drawer is a slim side panel with one card per theme and a live miniature of each, so the dossier stays in view while the viewer tries them. The choice applies to every open dossier.

`showThemes` turns this panel on or off; it is on by default. The viewer's pick is remembered per viewer, in `localStorage`.

## How do I set the React PDF viewer theme from my app?

Four props decide it:

- `defaultTheme`: the theme before the viewer chooses one. The default is `"surface"`.
- `theme`: a controlled theme. Leave it out to let the viewer choose.
- `onThemeChange`: called when the theme changes.
- `themeStorageKey`: the `localStorage` key of the viewer's choice, `"kavun-dossier-theme"` by default, and `null` for not remembered.

To start dark and still let the viewer change it:

```tsx
<KavunDossier
  title="Agreement.pdf"
  defaultTheme="dark"
  pageCount={pageCount}
  renderWidth={pageWidth}
  renderPage={(page) => <MyPdfPage page={page} width={pageWidth} />}
/>
```

## How do I follow the system's dark mode?

Make the theme controlled and set it from the browser's own `prefers-color-scheme` setting. This uses the standard `matchMedia` API, not anything kavun-specific:

```tsx
import { useEffect, useState } from "react";
import { KavunDossier, type KavunThemeName } from "@n-uf/kavun";

function Viewer() {
  const [theme, setTheme] = useState<KavunThemeName>("surface");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setTheme(media.matches ? "dark" : "surface");
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return <KavunDossier theme={theme} onThemeChange={setTheme} /* …the page props… */ />;
}
```

With `theme` controlled, the viewer's own pick comes back through `onThemeChange`, so it lands in your state, and the system setting wins again the next time it changes. If you want the system setting only for a first visit, save the viewer's pick yourself and use it as `defaultTheme`.

## How do I make the pages dark too?

kavun draws no PDF pages, so it can't. `renderPage` is handed the page number and whether the page is current, and nothing about the theme. What a page looks like in the dark, with a dark background, inverted colours or a dimmed canvas, is your renderer's call.

To make your pages follow the viewer's theme, keep the theme in your own state, as in the example above, and give it to your page component:

```tsx
renderPage={(page) => <MyPdfPage page={page} width={pageWidth} dark={theme === "dark"} />}
```

That is the reason to control `theme` even when you do not care about the system setting. What `dark` does inside `MyPdfPage` is up to you.

## Can I build my own theme picker, or my own theme?

For a picker of your own, `KAVUN_THEMES` has each theme's label, description and category, and `KAVUN_THEME_ORDER` the order the dossier shows them in. A plain select, with the theme controlled as in the example above, is a few lines:

```tsx
import { KAVUN_THEMES, KAVUN_THEME_ORDER, type KavunThemeName } from "@n-uf/kavun";

<select value={theme} onChange={(event) => setTheme(event.target.value as KavunThemeName)}>
  {KAVUN_THEME_ORDER.map((name) => (
    <option key={name} value={name}>
      {KAVUN_THEMES[name].label}
    </option>
  ))}
</select>
```

Each theme is a set of `--kd-*` CSS variables from `KAVUN_DOSSIER_TOKENS`, which the dossier sets on its own root.

kavun does not document a way to add a sixth theme, and it is young: the README warns that any 0.x release may change the five dossier themes and the `--kavun-*` theme variables, so pin an exact version when the package is available.

## What is it not?

It doesn't recolour the PDF. It is not an automatic dark mode either: nothing follows the system setting unless you wire it, as above. And the package is private, so you can read this page and try the demo, but you can't install it yet.

For the toolbar, zoom and thumbnails around the same pages, see the guide to a [React PDF viewer custom toolbar](/kavun/react-pdf-viewer-custom-toolbar). Every guide to the kit is listed on the [kavun guides](/kavun) page. The sister kits have their own: [harbuz's guides](/harbuz) and [dynia's guides](/dynia).
