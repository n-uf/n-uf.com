// Links into a future page, at build time: {{live:/papyrus/x}}…{{/live}} in a markdown body shows its sentence only
// when /papyrus/x is built (live, or a draft in dev and previews) and removes it otherwise. The rules and the errors
// are in live-blocks.mjs; this adds the lookup. Applied wherever an article body is rendered.
// A block that stays carries the day its target goes live, so the print layout (the article's PDF, printed from a
// preview build that shows every draft) can drop the blocks that its own page didn't have on its go-live day.
// @ts-ignore: plain JS module, so the tests can run it without Astro
import { applyLiveBlocks, liveTargets } from './live-blocks.mjs';
import { pageLiveFrom, pageStatus } from './articles';

/** The rendered HTML with its live blocks resolved; `file` (the entry's file) names the page in a build error. */
export async function withLiveBlocks(html: string, file: string): Promise<string> {
  if (!html.includes('{{')) return html;
  const known = new Map<string, 'built' | 'unbuilt' | 'none'>();
  const from = new Map<string, string | undefined>();
  for (const path of liveTargets(html) as Set<string>) {
    known.set(path, await pageStatus(path));
    from.set(path, await pageLiveFrom(path));
  }
  return applyLiveBlocks(html, (path: string) => known.get(path) ?? 'none', file, (path: string) => from.get(path));
}
