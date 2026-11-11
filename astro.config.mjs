import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { siteUrl } from './src/data/projects.ts';

// lastmod only for the pages of a content collection, from the `updated` date in their front matter (a build time
// isn't a change date). The hand-written pages get none. A draft isn't built in production, so it has no entry; in a
// preview it is listed without a date.
const lastmod = new Map();
for (const section of ['papyrus']) {
  const dir = `src/content/${section}`;
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.md'))) {
    const text = readFileSync(`${dir}/${file}`, 'utf8');
    const front = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
    if (/^draft:\s*true\s*$/m.test(front)) continue;
    const updated = front.match(/^updated:\s*["']?(\d{4}-\d{2}-\d{2})/m);
    if (updated) lastmod.set(`${siteUrl}/${section}/${file.slice(0, -3)}`, new Date(`${updated[1]}T00:00:00Z`));
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
