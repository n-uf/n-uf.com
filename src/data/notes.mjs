// The /notes/ section: what is listed, what the feed holds, and the section's own words. Plain JS with no Astro imports,
// so scripts/notes.test.mjs can run it; src/data/articles.ts adds the collection lookup and the pages call that.
//
// The one rule for "live" is `isLiveEntry` here (src/data/articles.ts re-exports it as `isLive`): a note is live unless
// its front matter says `draft: true`. The index, the feed, llms.txt, the home page link and the sitemap all follow it,
// so while no note is live the section has no page at all (no /notes, no /notes/rss.xml, no sitemap line, no link).

export const NOTES_PATH = "/notes";
export const NOTES_FEED_PATH = "/notes/rss.xml";
/** The index page's title, h1 and description (title at most 60 characters, description 120 to 155) */
export const NOTES_TITLE = "Notes on Claude and web interfaces";
export const NOTES_DESCRIPTION =
  "Tested notes on Claude Code and on web interfaces from n-uf: what was measured, on which version and when, and how to repeat it.";
/** The feed's own title */
export const NOTES_FEED_TITLE = "n-uf notes";

/** What the `topic` values read as on the page and in the feed */
export const topicLabel = { claude: "Claude", "web-ui": "Web interfaces" };

/** "/notes/<id>" */
export const notePath = (id) => `${NOTES_PATH}/${id}`;

/**
 * The one rule for "live": an entry is live unless its front matter says `draft: true`.
 * @param {{ data: { draft?: boolean } }} entry
 * @returns {boolean}
 */
export const isLiveEntry = (entry) => entry.data.draft !== true;

const day = (date) => date.toISOString().slice(0, 10);

/**
 * The notes a build shows: the live ones, plus drafts where drafts are shown (dev and Vercel previews). Newest first, by
 * the day each went live (`published`; a draft's is the day it is scheduled for), then by the day it last changed, then
 * by title. Notes are a log, so a note that is edited later keeps its place. Pinned notes (a living page such as the
 * changelog) come first, in the same order among themselves.
 * @template {{ id: string, data: { published: Date, updated: Date, title: string, draft?: boolean, pinned?: boolean } }} E
 * @param {E[]} entries
 * @param {boolean} showDrafts
 * @returns {E[]}
 */
export function visibleNotes(entries, showDrafts) {
  return entries
    .filter((entry) => showDrafts || isLiveEntry(entry))
    .sort(
      (a, b) =>
        Number(b.data.pinned === true) - Number(a.data.pinned === true) ||
        +b.data.published - +a.data.published || +b.data.updated - +a.data.updated || a.data.title.localeCompare(b.data.title),
    );
}

const XML = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const xml = (text) => String(text).replace(/[&<>"']/g, (c) => XML[c]);
/** Backticks removed, as in meta tags (src/data/inline-code.mjs) */
const plain = (text) => String(text).replace(/`/g, "");

/**
 * The RSS 2.0 feed of the notes this build shows. Item = title, permalink (also the guid), pubDate (the `published` day,
 * 00:00 UTC), the topic as category, and the description plus the takeaways as escaped HTML. Nothing in it depends on
 * the build time: lastBuildDate is the newest `updated`.
 * A draft (only in previews) is marked "(scheduled for <day>)" in its title.
 * @param {{ siteUrl: string, entries: Array<{ id: string, data: any }> }} input `entries` as `visibleNotes` returned them
 * @returns {string}
 */
export function rssFeed({ siteUrl, entries }) {
  const abs = (path) => new URL(path, siteUrl).href;
  const items = entries.map((entry) => {
    const d = entry.data;
    const url = abs(notePath(entry.id));
    const title = plain(d.title) + (isLiveEntry(entry) ? "" : ` (scheduled for ${day(d.published)})`);
    const html =
      `<p>${xml(plain(d.description))}</p>` + `<ul>${d.takeaways.map((t) => `<li>${xml(plain(t))}</li>`).join("")}</ul>`;
    return [
      "    <item>",
      `      <title>${xml(title)}</title>`,
      `      <link>${xml(url)}</link>`,
      `      <guid isPermaLink="true">${xml(url)}</guid>`,
      `      <pubDate>${d.published.toUTCString()}</pubDate>`,
      `      <category>${xml(topicLabel[d.topic] ?? d.topic)}</category>`,
      `      <dc:creator>${xml(d.author)}</dc:creator>`,
      `      <description>${xml(html)}</description>`,
      "    </item>",
    ].join("\n");
  });
  const newest = entries.reduce((max, entry) => (+entry.data.updated > +max ? entry.data.updated : max), new Date(0));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    `    <title>${xml(NOTES_FEED_TITLE)}</title>`,
    `    <link>${xml(abs(NOTES_PATH))}</link>`,
    `    <description>${xml(NOTES_DESCRIPTION)}</description>`,
    "    <language>en</language>",
    ...(entries.length > 0 ? [`    <lastBuildDate>${newest.toUTCString()}</lastBuildDate>`] : []),
    `    <atom:link href="${xml(abs(NOTES_FEED_PATH))}" rel="self" type="application/rss+xml" />`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
