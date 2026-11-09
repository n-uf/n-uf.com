import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { siteUrl } from './src/data/projects.ts';

export default defineConfig({
  site: siteUrl,
  output: 'static',
  integrations: [
    sitemap({
      customPages: [`${siteUrl}/llms.txt`],
      // Canonical URLs have no trailing slash (Layout.astro); list pages the same way.
      serialize(item) {
        const url = new URL(item.url);
        if (url.pathname !== '/' && url.pathname.endsWith('/')) {
          url.pathname = url.pathname.slice(0, -1);
        }
        return { ...item, url: url.href };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
