import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { siteUrl } from './src/data/projects.ts';
import { isDraft, updatedDay } from './src/data/front-matter.mjs';
import { PDF_DIR, copyShownPdfs, showsDrafts } from './src/data/article-pdfs.mjs';
import { isExternal, newTabNote } from './src/data/links.ts';
import rehypeExternalLinks from './src/data/rehype-external-links.mjs';

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

// The article PDFs (src/article-pdfs, printed by scripts/article-pdfs.mjs) are published at /papyrus/pdf/<slug>.pdf with
// the same drafts rule as the pages: production copies the live articles' PDFs only, a Vercel preview copies all.
// The dev server serves them from the folder (dev shows drafts).
const articlePdfs = {
  name: 'article-pdfs',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const copied = copyShownPdfs({ outDir: fileURLToPath(dir), showDrafts: showsDrafts() });
      if (copied.length > 0) console.log(`article-pdfs: published ${copied.length} PDF(s): ${copied.join(', ')}`);
    },
    'astro:server:setup': ({ server }) => {
      server.middlewares.use((req, res, next) => {
        const slug = /^\/papyrus\/pdf\/([a-z0-9-]+)\.pdf$/.exec((req.url ?? '').split('?')[0])?.[1];
        const file = slug ? `${PDF_DIR}/${slug}.pdf` : undefined;
        if (!file || !existsSync(file)) return next();
        res.setHeader('Content-Type', 'application/pdf');
        res.end(readFileSync(file));
      });
    },
  },
};

export default defineConfig({
  site: siteUrl,
  output: 'static',
  // Article code blocks are plain <pre><code>, styled by src/styles/article.css like the pre on the project pages
  // (Shiki would add its own colours and a background).
  // Links to other hosts in an article open in a new tab (src/data/rehype-external-links.mjs, rule in src/data/links.ts)
  markdown: {
    syntaxHighlight: false,
    rehypePlugins: [rehypeExternalLinks({ isExternal, note: newTabNote })],
  },
  integrations: [
    articlePdfs,
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
