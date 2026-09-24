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
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
