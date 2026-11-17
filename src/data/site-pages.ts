// The fixed pages of the site: the home page, the projects that live on n-uf.com itself (/papyrus,
// /claude-machine-transfer) and the kits' guides pages (/harbuz, /kavun, /dynia). They are always live, so an article's
// `related` list can always point at them.
// Plain data with no Astro imports, so the content schema (src/content.config.ts) can use it too.
import { kitList, type Kit } from './kits';
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
    // The kits live on their own subdomains, but their guides pages (/harbuz, /kavun, /dynia) are always-live pages of
    // this site, so a guide's `related` list can always point at its kit's page
    ...kitList.map((kit: Kit) => ({ path: kit.path, title: kit.title, description: kit.description })),
  ];
}

export const fixedPagePaths = (): Set<string> => new Set(fixedPages().map((page: FixedPage) => page.path));
