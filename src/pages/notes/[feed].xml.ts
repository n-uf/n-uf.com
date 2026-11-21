// /notes/rss.xml: the feed of the notes (RSS 2.0, src/data/notes.mjs). Built only while this build shows at least one
// note, like the index: the feed is the `[feed]` of this route, "rss" its only value, and with no note there is none.
// It holds the notes the build shows (live ones; drafts only in previews, marked as scheduled), never put in the sitemap.
import type { APIRoute } from 'astro';
import { getNotes } from '../../data/articles';
import { siteUrl } from '../../data/projects';
// @ts-ignore: plain JS module, so the tests can run it without Astro
import { rssFeed } from '../../data/notes.mjs';

export async function getStaticPaths() {
  return (await getNotes()).length > 0 ? [{ params: { feed: 'rss' } }] : [];
}

export const GET: APIRoute = async (): Promise<Response> =>
  new Response(rssFeed({ siteUrl, entries: await getNotes() }), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
