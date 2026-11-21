// The front matter of a note (src/content/notes/<slug>.md, served at /notes/<slug>). Same limits as the article schema
// of the other collections (src/content.config.ts): title at most 60 characters, description 120 to 155, takeaways, FAQ
// answers, dated drafts, no {{live:}} markers in front matter. What is different, and why (notes are first-hand pieces,
// not product pages):
//   - `evidence` is required: one line saying what is first-hand and where it comes from, so a note can't skip it;
//   - `tested` (a day) says when it was tried; a note of kind `test` must have one, and none may be dated ahead;
//   - `repro` is a link to the script, repo or gist that repeats it;
//   - `topic` is `claude` or `web-ui`; there are no tag pages;
//   - the FAQ is optional (0 to 5): a test note must not grow filler questions to meet a minimum;
//   - `actions` at most 2, and `related` must name /notes, the one page that is live whenever any note is.
// It imports zod from astro/zod (what `z` in astro:content is), so scripts/notes.test.mjs can run it without Astro.
import { z } from 'astro/zod';
import { NOTES_PATH } from './notes.mjs';

// A path on this site in the canonical form (no trailing slash, "/" for the home page). A trailing slash is accepted
// and removed, so "/papyrus/" and "/papyrus" mean the same page.
export const sitePath = z
  .string()
  .regex(
    /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*\/?)?$/,
    'a site path in lower case, e.g. /papyrus/some-article',
  )
  .transform((path: string): string => (path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path));

const today = (): string => new Date().toISOString().slice(0, 10);

export const noteSchema = z
  .object({
    title: z.string().max(60),
    description: z.string().min(120).max(155),
    h1: z.string().min(10).max(90),
    mainKeyword: z.string().min(3),
    kind: z.enum(['how-to', 'what-is', 'comparison', 'best-tools', 'use-case', 'test', 'log']),
    topic: z.enum(['claude', 'web-ui']),
    // What is first-hand about the piece: a test, data, a demo or code, in one line (shown near the top of the page)
    evidence: z.string().min(20).max(220),
    // The day it was tried (UTC). Required for kind `test`; never a future day.
    tested: z.coerce.date().optional(),
    // The script, repository or gist that repeats it
    repro: z.string().url().optional(),
    // The day the note goes live (UTC); for a draft, the day it is scheduled for.
    published: z.coerce.date(),
    updated: z.coerce.date(),
    // true: scheduled, not live yet. The publish workflow flips it to false on its date.
    draft: z.boolean().default(false),
    author: z.literal('n-uf'),
    takeaways: z.array(z.string().min(20)).min(3).max(5),
    faq: z
      .array(z.object({ q: z.string().endsWith('?'), a: z.string().min(40) }))
      .max(5)
      .default([]),
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
    // Calls to action placed in the body at build time (src/data/actions.mjs), only where a product solves the problem
    // the paragraph names. Optional: most notes have none.
    actions: z
      .array(
        z.object({
          heading: z.string().min(8).max(70),
          text: z.string().min(40).max(220),
          label: z.string().min(6).max(40),
          href: z.string().url(),
        }),
      )
      .max(2)
      .optional(),
  })
  .refine((data) => data.updated >= data.published, {
    message: 'updated is earlier than published',
    path: ['updated'],
  })
  // For a draft dated ahead (draft: true, published in the future) set `updated` equal to `published`: the flip
  // changes only the `draft` line, and `updated` may not be earlier than `published`.
  // A live note can't be dated in the future (UTC days); only a draft may wait for its date.
  .refine((data) => data.draft || data.published.toISOString().slice(0, 10) <= today(), {
    message: 'published is a future date but the note is not a draft: set draft: true (it goes live on that date)',
    path: ['published'],
  })
  .refine((data) => data.kind !== 'test' || data.tested !== undefined, {
    message: 'a note of kind "test" needs `tested`: the day the test was run',
    path: ['tested'],
  })
  .refine((data) => data.tested === undefined || data.tested.toISOString().slice(0, 10) <= today(), {
    message: 'tested is a future day: a note reports a test that has been run',
    path: ['tested'],
  })
  // `related` may name notes that are not live yet (production leaves those entries out until they are); /notes is
  // live whenever any note is, so it is always there on the day this note goes live.
  .refine((data) => data.related.includes(NOTES_PATH), {
    message: 'related needs /notes (the index of the section, live whenever any note is)',
    path: ['related'],
  })
  // {{live:/path}}…{{/live}} works only in the markdown body (src/data/live-blocks.mjs): in front matter it would show
  // as is in titles, meta tags, FAQ and JSON-LD.
  .refine((data) => !/\{\{\s*\/?\s*live/i.test(JSON.stringify(data)), {
    message: '{{live:…}} blocks work only in the markdown body, not in front matter',
  });
