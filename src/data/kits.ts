// The three React UI kits whose search pages live on n-uf.com (operator, 2026-11-17: the kits' guides are hosted here,
// not on the kit subdomains). One entry per kit: its guides page (/harbuz, /kavun, /dynia, src/components/KitGuides.astro),
// the kit's own site that every guide links to, and the words the pages use about the kit.
//
// Plain data with no Astro imports, so src/data/site-pages.ts, src/data/articles.ts and the page components can all read
// it. The kits' package and sources are private and not installable yet, so nothing here links to a repository.
//
// The guides page must not take the kit home's search ("react ui kit", "react pdf viewer component", "react document
// viewer component" belong to the kit's own site): its title, h1 and description name the kit and its guides only.

export type KitId = 'harbuz' | 'kavun' | 'dynia';

export interface Kit {
  id: KitId;
  /** The product's name, always spelled like this */
  name: string;
  /** The kit's own site: the guides link to it, the guides page's SoftwareSourceCode node names it as its url */
  siteUrl: string;
  /** The guides page: /harbuz */
  path: string;
  /** <title> and og:title, at most 60 characters */
  title: string;
  /** The page's h1: the same words as the title */
  h1: string;
  /** Meta description, 120 to 155 characters */
  description: string;
  /** What the kit is, in the README's and the site's own words (the guides page's opening paragraphs, in order) */
  about: readonly string[];
  /** The link text under the kit's entry on the home page */
  homeLabel: string;
  /** The label of the button to the kit's own site */
  siteButton: string;
}

export const kits: Record<KitId, Kit> = {
  harbuz: {
    id: 'harbuz',
    name: 'harbuz',
    siteUrl: 'https://harbuz.n-uf.com',
    path: '/harbuz',
    title: 'harbuz guides: theming, file explorer and more',
    h1: 'harbuz guides: theming, file explorer and more',
    description:
      'Guides to harbuz, n-uf’s set of React components with eight CSS themes: switch themes, build a file explorer, see what each part does. Not installable yet.',
    about: [
      'harbuz is a collection of React components from n-uf: primitives, blocks and shells for dossiers (a document shell), terminals and file explorers, with eight built-in CSS-variable themes. It is built with React 19, TypeScript, Tailwind CSS v4 and Radix UI primitives, and it ships as TypeScript source.',
      'harbuz.n-uf.com is built from harbuz itself: the whole site is one HarbuzDossier, so every part below can be tried live there. The guides here take one job at a time and show the code that does it.',
    ],
    homeLabel: 'harbuz guides',
    siteButton: 'Open harbuz.n-uf.com',
  },
  kavun: {
    id: 'kavun',
    name: 'kavun',
    siteUrl: 'https://kavun.n-uf.com',
    path: '/kavun',
    title: 'kavun guides: toolbar, themes and more',
    h1: 'kavun guides: toolbar, themes and more',
    description:
      'Guides to kavun, n-uf’s React components for document viewers: the dossier’s toolbar, zoom and themes around any PDF renderer. Not installable yet.',
    about: [
      'kavun is a set of React components for viewing documents, in a panel language of engraved monospace chrome, caution pink and LED cyan. It holds a document dossier, a bare dossier, a file explorer and the primitives and blocks they are built from. The dossier offers five themes and panels that dock on either side.',
      'kavun draws no PDF pages. Your app supplies each page through `renderPage`, from pdf.js or any other renderer, and kavun is the interface around it. kavun.n-uf.com is built from kavun itself, so every part can be tried live there. The guides here take one job at a time.',
    ],
    homeLabel: 'kavun guides',
    siteButton: 'Open kavun.n-uf.com',
  },
  dynia: {
    id: 'dynia',
    name: 'dynia',
    siteUrl: 'https://dynia.n-uf.com',
    path: '/dynia',
    title: 'dynia guides: dashboard blocks, stepper and more',
    h1: 'dynia guides: dashboard blocks, stepper and more',
    description:
      'Guides to dynia, n-uf’s React components for dossiers and analytics dashboards: stat tiles, charts, tables and a pipeline stepper. Not installable yet.',
    about: [
      'dynia is a layered set of React components: a document dossier whose every part moves, and app-agnostic blocks for analytics dashboards in the same visual language. Its layers run from tokens and primitives through blocks to whole-screen shells.',
      'dynia draws no pages and keeps no data of its own. A dashboard app keeps its own metrics, queries and summary rules, and a dossier app supplies the pages; dynia only draws. dynia.n-uf.com shows every part live in its library. The guides here take one job at a time.',
    ],
    homeLabel: 'dynia guides',
    siteButton: 'Open dynia.n-uf.com',
  },
};

export const kitList: readonly Kit[] = [kits.harbuz, kits.kavun, kits.dynia];

/** A kit by its id, or undefined (the id of any project or collection key may be passed in) */
export const kitOf = (id: string): Kit | undefined => (id in kits ? kits[id as KitId] : undefined);
