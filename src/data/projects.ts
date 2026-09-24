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

export const studioSummary: string = "Interface tools, built in the open.";

export const siteUrl: string = "https://n-uf.com";

export const githubOrgUrl: string = "https://github.com/n-uf";

export const projects: readonly Project[] = [
  {
    id: "hypr-tiling",
    name: "hypr-tiling",
    tagline: "Rearrange the interface, at runtime.",
    description:
      "A dynamic tiling renderer for React: drag, resize, group, keyboard, and workspaces. Licence: PolyForm Perimeter 1.0.1.",
    url: "https://hypr-tiling.n-uf.com",
    repo: "https://github.com/n-uf/hypr-tiling",
    npm: "@n-uf/hypr-tiling",
    status: "live",
  },
  {
    id: "doodl",
    name: "DOODL",
    tagline: "Canvas drawing and annotation for the web.",
    description:
      "A canvas library for drawing and annotation, with React, PDF, and ready-made UI bindings.",
    url: "https://doodl.n-uf.com",
    repo: "https://github.com/n-uf/pdf-doodl",
    status: "live",
  },
  {
    id: "debugsy",
    name: "debugsy",
    tagline: "real-time React debugging panel",
    description:
      "An in-process React inspector. It logs renders, effects, state, and fetch in one panel.",
    url: "https://debugsy.n-uf.com",
    status: "live",
  },
];

export function listedProjects(): readonly Project[] {
  return projects.filter(
    (project: Project): boolean => project.status !== "preview",
  );
}
