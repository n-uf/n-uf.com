export interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  repo?: string;
  npm?: string;
  status: "live" | "preview";
}

export const studioName: string = "n-uf";

export const studioSummary: string =
  "Utilities for fun and for professional work. Open source, or nearly — source on GitHub, licence stated per project.";

export const siteUrl: string = "https://n-uf.com";

export const githubOrgUrl: string = "https://github.com/n-uf";

export const projects: readonly Project[] = [
  {
    id: "hypr-tiling",
    name: "hypr-tiling",
    tagline:
      "React tiling layout library: split and resize panes, tab groups, multiple workspaces, serialisable layouts.",
    description:
      "Keyboard commands. Licence: PolyForm Perimeter 1.0.1.",
    url: "https://hypr-tiling.n-uf.com",
    repo: "https://github.com/n-uf/hypr-tiling",
    npm: "@n-uf/hypr-tiling",
    status: "live",
  },
  {
    id: "doodl",
    name: "DOODL",
    tagline:
      "Canvas drawing and annotation library for the web: freehand, shapes, text markup, PDF pages.",
    description:
      "Packages: @n-uf/doodl, @n-uf/doodl-react, @n-uf/doodl-react-pdf, @n-uf/doodl-go. JSON export. Licence: PolyForm Perimeter 1.0.1.",
    url: "https://doodl.n-uf.com",
    repo: "https://github.com/n-uf/doodl",
    status: "live",
  },
  {
    id: "debugsy",
    name: "debugsy",
    tagline:
      "In-process React debugging panel: logs renders, effects, state, and fetch.",
    description:
      "Records re-render causes from dependency and prop changes.",
    url: "https://debugsy.n-uf.com",
    status: "live",
  },
  {
    id: "cl_audit",
    name: "cl_audit",
    tagline:
      "macOS app for several Claude accounts: a separate Claude desktop app per account, usage limits in the Dock, a usage dashboard.",
    description:
      "Limits read directly from Anthropic; usage history from the Claude Code session logs on the Mac. Licence: PolyForm Perimeter 1.0.1. Not affiliated with Anthropic.",
    url: "https://cl-audit.n-uf.com",
    repo: "https://github.com/n-uf/cl_audit",
    status: "live",
  },
  {
    id: "harbuz",
    name: "harbuz",
    tagline:
      "React UI kit: composable primitives, blocks and shells (dossier, terminal, explorers) with a CSS-variable theme system.",
    description:
      "The site is one HarbuzDossier: page through it, switch themes, draw on the pages with DOODL tools. Source not public yet.",
    url: "https://harbuz.n-uf.com",
    status: "live",
  },
  {
    id: "kavun",
    name: "kavun",
    tagline:
      "React UI kit in a panel language: engraved monospace chrome, caution pink and LED cyan. A file explorer and a document dossier.",
    description:
      "Five themes, fit-to-page, several documents open side by side. Source not public yet.",
    url: "https://kavun.n-uf.com",
    status: "live",
  },
  {
    id: "dynia",
    name: "dynia",
    tagline:
      "React UI kit in the pdfized.com look, with a PDF dossier whose every part moves.",
    description:
      "Control blocks dock in the title, top, bottom and side bars, the thumbnail rail or a card, or float; the rail and cards move and resize. Source not public yet.",
    url: "https://dynia.n-uf.com",
    status: "live",
  },
];

export function listedProjects(): readonly Project[] {
  return projects.filter(
    (project: Project): boolean => project.status !== "preview",
  );
}
