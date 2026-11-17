// Content collections: the articles under a project's page, one collection per project (papyrus, in
// src/content/papyrus/*.md, served at /papyrus/<slug>; the three kits harbuz, kavun and dynia, in src/content/<kit>/*.md,
// served at /<kit>/<slug>). All share one schema. A file that breaks it fails the build.
// Another project gets its own collection: add a folder here, an entry in `collections` below and an entry in
// `sections` in src/data/articles.ts (its page, and for a kit its entry in src/data/kits.ts).
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { hasAlwaysLiveEntry } from './data/related.mjs';
import { fixedPagePaths } from './data/site-pages';

// A path on this site in the canonical form (no trailing slash, "/" for the home page). A trailing slash is accepted
// and removed, so "/papyrus/" and "/papyrus" mean the same page.
const sitePath = z
  .string()
  .regex(
    /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*\/?)?$/,
    'a site path in lower case, e.g. /papyrus/some-article',
  )
  .transform((path: string): string => (path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path));

const article = z
  .object({
    title: z.string().max(60),
    description: z.string().min(120).max(155),
    h1: z.string().min(10).max(90),
    mainKeyword: z.string().min(3),
    kind: z.enum(['how-to', 'what-is', 'comparison', 'best-tools', 'use-case']),
    // The day the page goes live (UTC); for a draft, the day it is scheduled for.
    published: z.coerce.date(),
    updated: z.coerce.date(),
    // true: scheduled, not live yet. The publish workflow flips it to false on its date.
    draft: z.boolean().default(false),
    author: z.literal('n-uf'),
    takeaways: z.array(z.string().min(20)).min(3).max(5),
    faq: z
      .array(z.object({ q: z.string().endsWith('?'), a: z.string().min(40) }))
      .min(4)
      .max(5),
    sources: z
      .array(
        z.object({
          title: z.string(),
          url: z.string().url(),
          checked: z.coerce.date(),
          supports: z.string().optional(),
          quote: z.string().optional(),
        }),
      )
      .default([]),
    related: z.array(sitePath).min(2).max(4),
    // Calls to action placed in the body at build time (src/data/actions.mjs): where the page's problem is named, a
    // heading, one sentence and one button. Optional: an article without them (every papyrus one) shows none.
    actions: z
      .array(
        z.object({
          heading: z.string().min(8).max(70),
          text: z.string().min(40).max(220),
          label: z.string().min(6).max(40),
          href: z.string().url(),
        }),
      )
      .max(3)
      .optional(),
  })
  .refine((data) => data.updated >= data.published, {
    message: 'updated is earlier than published',
    path: ['updated'],
  })
  // For a draft dated ahead (draft: true, published in the future) set `updated` equal to `published`: the flip
  // changes only the `draft` line, and `updated` may not be earlier than `published`.
  // A live page can't be dated in the future (UTC days); only a draft may wait for its date.
  .refine(
    (data) => data.draft || data.published.toISOString().slice(0, 10) <= new Date().toISOString().slice(0, 10),
    {
      message: 'published is a future date but the page is not a draft: set draft: true (it goes live on that date)',
      path: ['published'],
    },
  )
  // `related` may name articles that are not live yet (production leaves those entries out until they are), so at least
  // one entry must be a page that is always live, such as /papyrus: the list is never empty on the day of the first article.
  .refine((data) => hasAlwaysLiveEntry(data.related, fixedPagePaths()), {
    message: 'related needs at least one page that is always live, such as /papyrus (articles that are still drafts are left out in production)',
    path: ['related'],
  })
  // {{live:/path}}…{{/live}} works only in the markdown body (src/data/live-blocks.mjs): in front matter it would show
  // as is in titles, meta tags, FAQ and JSON-LD.
  .refine((data) => !/\{\{\s*\/?\s*live/i.test(JSON.stringify(data)), {
    message: '{{live:…}} blocks work only in the markdown body, not in front matter',
  });

export const collections = {
  papyrus: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/papyrus' }), schema: article }),
  harbuz: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/harbuz' }), schema: article }),
  kavun: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/kavun' }), schema: article }),
  dynia: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/dynia' }), schema: article }),
};
