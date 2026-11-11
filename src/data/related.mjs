// An article's `related` list on the day it goes live. Production hides the articles that are still drafts, and a
// related entry that points at one is skipped, like a {{live:}} block: it appears the day that article goes live. So the
// first article of a series can name the later ones before they exist. An entry that points at no page at all (a typo, a
// page with no file) still fails the build, and the schema requires at least one entry that is always live.
// Plain JS with no Astro imports so that scripts/related.test.mjs can run it.

/**
 * The cards for a related list.
 * @param {string[]} paths the article's `related` paths
 * @param {{ fixed: Map<string, {title: string, description: string}>,
 *           articles: Map<string, {title: string, description: string, live: boolean}>, showDrafts: boolean }} known
 *   fixed: the always-live pages; articles: every article file by path, live or not; showDrafts: dev and previews
 * @returns {{ path: string, title: string, description: string }[]}
 */
export function resolveRelated(paths, { fixed, articles, showDrafts }) {
  const cards = [];
  for (const path of paths) {
    const page = fixed.get(path);
    if (page) {
      cards.push({ path, title: page.title, description: page.description });
      continue;
    }
    const article = articles.get(path);
    if (!article) {
      throw new Error(`related link "${path}" points to no page on this site (a typo, or a page with no file)`);
    }
    if (article.live || showDrafts) cards.push({ path, title: article.title, description: article.description });
  }
  return cards;
}

/** Does the list have an entry that is always live (a fixed page such as /papyrus)? */
export const hasAlwaysLiveEntry = (paths, fixedPaths) => paths.some((path) => fixedPaths.has(path));
