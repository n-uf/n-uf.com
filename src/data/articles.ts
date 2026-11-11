// Helpers for the article collections (one per project, see src/content.config.ts): what is live, what a path means,
// and the addresses. The one rule for drafts lives here, in `isLive` and `showDrafts`, and every page, list, sitemap
// entry and llms.txt line asks these two.
import { getCollection, type CollectionEntry } from 'astro:content';
import { projects, siteUrl, studioSummary, type Project } from './projects';

export type Entry = CollectionEntry<'papyrus'>;
export type SectionKey = 'papyrus';

export interface Section {
  /** The collection's folder under src/content, and the first part of every article's address */
  key: SectionKey;
  /** Breadcrumb text, and the project's name */
  label: string;
  /** The project's own page, which lists the live articles: /papyrus */
  path: string;
  /** The project's SoftwareSourceCode node, which the articles are "about" */
  softwareId: string;
  repoUrl: string;
  repoName: string;
}

export const sections: Record<SectionKey, Section> = {
  papyrus: {
    key: 'papyrus',
    label: 'papyrus',
    path: '/papyrus',
    softwareId: `${siteUrl}/papyrus#software`,
    repoUrl: 'https://github.com/n-uf/papyrus',
    repoName: 'n-uf/papyrus',
  },
};

// Counted with a file glob first: asking Astro for an empty collection logs a warning on every page that does it.
const fileCount: Record<SectionKey, number> = {
  papyrus: Object.keys(import.meta.glob('/src/content/papyrus/*.md')).length,
};

export const kindLabel: Record<Entry['data']['kind'], string> = {
  'how-to': 'How-to',
  'what-is': 'Explainer',
  comparison: 'Comparison',
  'best-tools': 'Best tools',
  'use-case': 'Use case',
};

/** The one rule for "live": an article is live unless its front matter says `draft: true`. */
export const isLive = (entry: Entry): boolean => entry.data.draft !== true;

/**
 * Dev and Vercel previews also show drafts (with a "Scheduled for" badge and noindex), so a try sees the whole
 * batch. Production builds (VERCEL_ENV=production) and a plain local `astro build` with no VERCEL_ENV hide them:
 * no page, no list entry, no sitemap or llms.txt line.
 */
export const showDrafts: boolean = import.meta.env.DEV || process.env.VERCEL_ENV === 'preview';

/** Newest first: by the day the text last changed, then by the day it went live, then by title. */
const newestFirst = (a: Entry, b: Entry): number =>
  +b.data.updated - +a.data.updated || +b.data.published - +a.data.published || a.data.title.localeCompare(b.data.title);

/** The articles of a section that this build shows: the live ones, plus drafts in dev and previews. */
export async function getArticles(key: SectionKey): Promise<Entry[]> {
  if (fileCount[key] === 0) return [];
  const all: Entry[] = await getCollection(key);
  return (showDrafts ? all : all.filter(isLive)).sort(newestFirst);
}

/** "/papyrus/how-to-x" */
export const articlePath = (key: SectionKey, id: string): string => `${sections[key].path}/${id}`;

/** "2026-11-24" date -> "24 Nov 2026" */
export const dateText = (date: Date): string =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);

/** The fixed pages of the site, from the projects that live on n-uf.com itself, plus the home page. */
function fixedPages(): { path: string; title: string; description: string }[] {
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

/**
 * Is a site path a page of this build? "built": a fixed page, or an article that is live (or a draft, where drafts
 * are shown); "unbuilt": an article whose draft is hidden in this build; "none": no page at all.
 * Used by the {{live:}} blocks (live.ts).
 */
export async function pageStatus(path: string): Promise<'built' | 'unbuilt' | 'none'> {
  if (fixedPages().some((page) => page.path === path)) return 'built';
  for (const key of Object.keys(sections) as SectionKey[]) {
    if (!path.startsWith(`${sections[key].path}/`)) continue;
    if (fileCount[key] === 0) return 'none';
    const all: Entry[] = await getCollection(key);
    const found = all.find((entry) => articlePath(key, entry.id) === path);
    if (found) return showDrafts || isLive(found) ? 'built' : 'unbuilt';
  }
  return 'none';
}

/**
 * The title and description of a site path, for the Related cards. Throws on a path that is no page of this build
 * (it doesn't exist, or it is a draft that production hides), so a broken or early link fails the build.
 */
export async function pageInfo(path: string): Promise<{ title: string; description: string }> {
  const fixed = fixedPages().find((page) => page.path === path);
  if (fixed) return fixed;
  for (const key of Object.keys(sections) as SectionKey[]) {
    const found = (await getArticles(key)).find((entry) => articlePath(key, entry.id) === path);
    if (found) return { title: found.data.h1, description: found.data.description };
  }
  throw new Error(`related link "${path}" points to no page of this build (it does not exist, or it is still a draft)`);
}
