// Helpers for the article collections (one per project, see src/content.config.ts): what is live, what a path means,
// and the addresses. The one rule for drafts lives here, in `isLive` and `showDrafts`, and every page, list, sitemap
// entry and llms.txt line asks these two.
import { getCollection, type CollectionEntry } from 'astro:content';
import { siteUrl } from './projects';
import { resolveRelated } from './related.mjs';
import { fixedPages } from './site-pages';

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

/** The day an article goes live (its `published`, YYYY-MM-DD); undefined for a fixed page or a path with no article. */
export async function pageLiveFrom(path: string): Promise<string | undefined> {
  for (const key of Object.keys(sections) as SectionKey[]) {
    if (fileCount[key] === 0 || !path.startsWith(`${sections[key].path}/`)) continue;
    const found = ((await getCollection(key)) as Entry[]).find((entry) => articlePath(key, entry.id) === path);
    if (found) return found.data.published.toISOString().slice(0, 10);
  }
  return undefined;
}

/**
 * The Related cards of an article. An entry that points at an article still hidden as a draft is left out (it appears
 * the day that article goes live); an entry that points at no page at all throws, so a typo fails the build
 * (src/data/related.mjs).
 */
export async function relatedCards(paths: string[]): Promise<{ path: string; title: string; description: string }[]> {
  const fixed = new Map(fixedPages().map((page) => [page.path, page]));
  const articles = new Map<string, { title: string; description: string; live: boolean }>();
  for (const key of Object.keys(sections) as SectionKey[]) {
    if (fileCount[key] === 0) continue;
    for (const entry of (await getCollection(key)) as Entry[]) {
      articles.set(articlePath(key, entry.id), { title: entry.data.h1, description: entry.data.description, live: isLive(entry) });
    }
  }
  return resolveRelated(paths, { fixed, articles, showDrafts });
}
