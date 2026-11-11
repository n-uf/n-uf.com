import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { siteUrl } from './src/data/projects.ts';
import { isDraft, updatedDay } from './src/data/front-matter.mjs';

// lastmod only for the pages of a content collection, from the `updated` date in their front matter (a build time
// isn't a change date). The hand-written pages get none. A draft isn't built in production, so it has no entry; in a
// preview it is listed without a date.
const lastmod = new Map();
for (const section of ['papyrus']) {
  const dir = `src/content/${section}`;
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.md'))) {
    const text = readFileSync(`${dir}/${file}`, 'utf8');
    // The same reading of `draft` and `updated` as the publish flip (src/data/front-matter.mjs)
    if (isDraft(text)) continue;
    const day = updatedDay(text);
    if (day) lastmod.set(`${siteUrl}/${section}/${file.slice(0, -3)}`, new Date(`${day}T00:00:00Z`));
  }
}

export default defineConfig({
  site: siteUrl,
  output: 'static',
  // Article code blocks are plain <pre><code>, styled by src/styles/article.css like the pre on the project pages
  // (Shiki would add its own colours and a background).
  markdown: { syntaxHighlight: false },
  integrations: [
    sitemap({
      // Canonical URLs have no trailing slash (Layout.astro); list pages the same way.
      serialize(item) {
        const url = new URL(item.url);
        if (url.pathname !== '/' && url.pathname.endsWith('/')) {
          url.pathname = url.pathname.slice(0, -1);
        }
        const date = lastmod.get(url.href);
        return { ...item, url: url.href, ...(date && { lastmod: date.toISOString() }) };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
