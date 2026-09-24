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
  "Libraries and a debugging panel for web interfaces. hypr-tiling and DOODL: source on GitHub, packages on npm.";

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
      "React bindings and JSON export. npm: @n-uf/pdf-doodl. Licence: PolyForm Perimeter 1.0.1.",
    url: "https://doodl.n-uf.com",
    repo: "https://github.com/n-uf/pdf-doodl",
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
];

export function listedProjects(): readonly Project[] {
  return projects.filter(
    (project: Project): boolean => project.status !== "preview",
  );
}
