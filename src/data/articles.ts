// Helpers for the article collections (one per project, see src/content.config.ts): what is live, what a path means,
// and the addresses. The one rule for drafts lives here, in `isLive` and `showDrafts`, and every page, list, sitemap
// entry and llms.txt line asks these two.
import { getCollection, type CollectionEntry } from 'astro:content';
import { kits, type Kit } from './kits';
import { siteUrl } from './projects';
import { resolveRelated } from './related.mjs';
import { fixedPages } from './site-pages';
// @ts-ignore: plain JS module, so the tests can run it without Astro
import { NOTES_DESCRIPTION, NOTES_PATH, NOTES_TITLE, isLiveEntry, notePath, visibleNotes } from './notes.mjs';

// Every collection has the same `article` schema (src/content.config.ts), so an entry is one shape whichever it is from
export type SectionKey = 'papyrus' | 'harbuz' | 'kavun' | 'dynia';
export type Entry = CollectionEntry<SectionKey>;

export interface Section {
  /** The collection's folder under src/content, and the first part of every article's address */
  key: SectionKey;
  /** Breadcrumb text, and the project's name */
  label: string;
  /** The project's own page, which lists the live articles: /papyrus */
  path: string;
  /** The project's SoftwareSourceCode node, which the articles are "about" */
  softwareId: string;
  /** What the page lists the entries as ("Articles", "Guides") */
  listLabel: string;
  /** The project's public repository; a kit's is private, so none */
  repoUrl?: string;
  repoName?: string;
  /** The project's own site, when the articles are about a project that has one (a kit's subdomain) */
  siteUrl?: string;
}

/** A section whose project has a public repository: the article page's top bar links to it */
export interface RepoSection extends Section {
  repoUrl: string;
  repoName: string;
}

/** The section of a kit: the guides page at /<kit>, no repository (the kits are private and not installable yet) */
const kitSection = (kit: Kit): Section => ({
  key: kit.id,
  label: kit.name,
  path: kit.path,
  softwareId: `${siteUrl}${kit.path}#software`,
  listLabel: 'Guides',
  siteUrl: kit.siteUrl,
});

export const sections: Record<SectionKey, Section> & { papyrus: RepoSection } = {
  papyrus: {
    key: 'papyrus',
    label: 'papyrus',
    path: '/papyrus',
    softwareId: `${siteUrl}/papyrus#software`,
    listLabel: 'Articles',
    repoUrl: 'https://github.com/n-uf/papyrus',
    repoName: 'n-uf/papyrus',
  },
  harbuz: kitSection(kits.harbuz),
  kavun: kitSection(kits.kavun),
  dynia: kitSection(kits.dynia),
};

// Counted with a file glob first: asking Astro for an empty collection logs a warning on every page that does it.
// (import.meta.glob takes literal patterns, so each section has its own line.)
const fileCount: Record<SectionKey, number> = {
  papyrus: Object.keys(import.meta.glob('/src/content/papyrus/*.md')).length,
  harbuz: Object.keys(import.meta.glob('/src/content/harbuz/*.md')).length,
  kavun: Object.keys(import.meta.glob('/src/content/kavun/*.md')).length,
  dynia: Object.keys(import.meta.glob('/src/content/dynia/*.md')).length,
};

export const kindLabel: Record<Entry['data']['kind'], string> = {
  'how-to': 'How-to',
  'what-is': 'Explainer',
  comparison: 'Comparison',
  'best-tools': 'Best tools',
  'use-case': 'Use case',
};

/** The one rule for "live": an article is live unless its front matter says `draft: true` (src/data/notes.mjs). */
export const isLive = (entry: Entry | NoteEntry): boolean => isLiveEntry(entry);

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

// ---- The notes (src/content/notes, /notes/<slug>): not a project's articles, so not in `sections`; they have their own
// schema (src/data/note-schema.ts), and the same drafts rule. The index (/notes) and the feed (/notes/rss.xml) exist
// only while this build shows at least one note.

export type NoteEntry = CollectionEntry<'notes'>;

export const noteKindLabel: Record<NoteEntry['data']['kind'], string> = {
  ...kindLabel,
  test: 'Test',
  log: 'Log',
};

const noteFileCount: number = Object.keys(import.meta.glob('/src/content/notes/*.md')).length;

/** Every note file, live or not */
async function allNotes(): Promise<NoteEntry[]> {
  return noteFileCount === 0 ? [] : ((await getCollection('notes')) as NoteEntry[]);
}

/** The notes this build shows, newest first: the live ones, plus drafts in dev and previews (src/data/notes.mjs). */
export async function getNotes(): Promise<NoteEntry[]> {
  return visibleNotes(await allNotes(), showDrafts) as NoteEntry[];
}

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
  // The notes index is built while this build shows a note; a note is a page of this build like an article
  if (path === NOTES_PATH) return (await getNotes()).length > 0 ? 'built' : 'unbuilt';
  if (path.startsWith(`${NOTES_PATH}/`)) {
    const found = (await allNotes()).find((entry) => notePath(entry.id) === path);
    return found ? (showDrafts || isLive(found) ? 'built' : 'unbuilt') : 'none';
  }
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
  const day = (date: Date): string => date.toISOString().slice(0, 10);
  if (path === NOTES_PATH) {
    // the index goes live with the first note
    const days = (await allNotes()).map((entry) => day(entry.data.published)).sort();
    return days[0];
  }
  if (path.startsWith(`${NOTES_PATH}/`)) {
    const found = (await allNotes()).find((entry) => notePath(entry.id) === path);
    return found ? day(found.data.published) : undefined;
  }
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
  // The notes: each by its path, and the index as a page that is live once any note is (so a related entry that names
  // /notes is left out in production until the first note is live, like an entry that names a draft)
  const notes = await allNotes();
  for (const entry of notes) {
    articles.set(notePath(entry.id), { title: entry.data.h1, description: entry.data.description, live: isLive(entry) });
  }
  if (notes.length > 0) articles.set(NOTES_PATH, { title: NOTES_TITLE, description: NOTES_DESCRIPTION, live: notes.some(isLive) });
  return resolveRelated(paths, { fixed, articles, showDrafts });
}
