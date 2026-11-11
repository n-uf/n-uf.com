// The fixed pages of the site: the home page and the projects that live on n-uf.com itself (/papyrus,
// /claude-machine-transfer). They are always live, so an article's `related` list can always point at them.
// Plain data with no Astro imports, so the content schema (src/content.config.ts) can use it too.
import { projects, siteUrl, studioSummary, type Project } from './projects';

export interface FixedPage {
  path: string;
  title: string;
  description: string;
}

export function fixedPages(): FixedPage[] {
  const own = projects.filter((project: Project): boolean => project.url.startsWith(`${siteUrl}/`));
  return [
    { path: '/', title: 'n-uf', description: studioSummary },
    ...own.map((project: Project) => ({
      path: new URL(project.url).pathname,
      title: project.name,
      description: project.tagline,
    })),
  ];
}

export const fixedPagePaths = (): Set<string> => new Set(fixedPages().map((page: FixedPage) => page.path));
