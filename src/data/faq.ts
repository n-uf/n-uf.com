// The questions on the home page and on /claude-machine-transfer. One source for the three places that show them: the
// visible section (src/components/Faq.astro), the FAQPage JSON-LD (answerText, so the markup repeats the visible words)
// and /llms.txt (answerMarkdown).
//
// The format is the one a search result can lift into "People also ask": a question worded the way people search, then
// one paragraph of 40 to 60 words whose first sentence is the direct answer. Links come after that sentence, never
// inside it. scripts/faq.test.mjs checks the format and checks the home answers against src/data/projects.ts, so a
// project added, renamed or relicensed there fails a test here until the answers are rewritten.
// The extensions on the imports let Node load this file in that test (Astro and Vite accept them too).
import { githubOrgUrl, projects, type Project } from './projects.ts';

/** A piece of an answer: plain text, or text that links somewhere (an external link opens in a new tab) */
export type Part = string | { text: string; href: string };

export interface FaqItem {
  q: string;
  a: readonly Part[];
}

const project = (id: string): Project => {
  const found: Project | undefined = projects.find((entry: Project): boolean => entry.id === id);
  if (found === undefined) throw new Error(`faq: no project "${id}" in src/data/projects.ts`);
  return found;
};

/** The project's name as a link to its site */
const site = (id: string): Part => ({ text: project(id).name, href: project(id).url });

/** The project's name as a link to its repository */
const repo = (id: string): Part => {
  const url: string | undefined = project(id).repo;
  if (url === undefined) throw new Error(`faq: project "${id}" has no repo`);
  return { text: project(id).name, href: url };
};

const polyform: Part = {
  text: 'PolyForm Perimeter 1.0.1',
  href: 'https://polyformproject.org/licenses/perimeter/1.0.1',
};

const orgLink: Part = { text: 'github.com/n-uf', href: githubOrgUrl };

const issues = (id: string): Part => ({
  text: `github.com/n-uf/${id}/issues`,
  href: `https://github.com/n-uf/${id}/issues`,
});

export const homeFaq: readonly FaqItem[] = [
  {
    q: 'What is n-uf?',
    a: [
      'n-uf makes utilities for fun and for professional work: libraries and React UI kits for developers, Mac apps for Claude, and a Claude Code skill. It is also written nuf or n uf. The code is on GitHub at ',
      orgLink,
      ', and each public project states its own licence.',
    ],
  },
  {
    q: 'What tools does n-uf make?',
    a: [
      'n-uf makes eleven tools: five developer libraries, three React UI kits, two Mac apps for Claude and a Claude Code skill. Each has its own page. They are ',
      site('hypr-tiling'),
      ', ',
      site('motion'),
      ', ',
      site('doodl'),
      ', ',
      site('debugsy'),
      ', ',
      site('papyrus'),
      ', ',
      site('harbuz'),
      ', ',
      site('kavun'),
      ', ',
      site('dynia'),
      ', ',
      site('cl_audit'),
      ', ',
      site('cl_quick'),
      ' and ',
      site('machine-transfer'),
      ". cl_quick's first release is not out yet.",
    ],
  },
  {
    q: 'Is n-uf free?',
    a: [
      'Yes: none of the tools is sold, and the eight with public source are free to use. hypr-tiling, motion & placement, DOODL, debugsy, papyrus, cl_audit and cl_quick use ',
      polyform,
      ', which lets you use, change and share them, but not to build a competing product. machine-transfer is MIT. harbuz, kavun and dynia have no public source yet.',
    ],
  },
  {
    q: 'Is n-uf open source?',
    a: [
      'Partly: eight of the eleven projects have public source, and only one of them, machine-transfer, is MIT-licensed open source. The other seven, ',
      repo('hypr-tiling'),
      ', ',
      repo('motion'),
      ', ',
      repo('doodl'),
      ', ',
      repo('debugsy'),
      ', ',
      repo('papyrus'),
      ', ',
      repo('cl_audit'),
      ' and ',
      repo('cl_quick'),
      ', are source-available under PolyForm Perimeter, which is not open source in the OSI sense. harbuz, kavun and dynia say their source is not public yet.',
    ],
  },
  {
    q: 'Is n-uf stable?',
    a: [
      'No, n-uf tools are not yet stable. The READMEs of the eight public projects carry a "Not yet stable" notice, and version numbers are dates (YY.M.R), not semantic versions, so any release may change how a tool works. Report problems as GitHub issues, for example at ',
      issues('hypr-tiling'),
      ' or ',
      issues('doodl'),
      '.',
    ],
  },
];

export const machineTransferFaq: readonly FaqItem[] = [
  {
    q: 'Why not just copy the disk to a new Mac?',
    a: [
      'Copying the disk moves the files and loses the rest. A busy Claude Code workspace also has lead sessions, branches with unpushed commits, sidebar sections, memory and skills in ~/.claude, scheduled tasks and signed-in tools. machine-transfer moves it by fresh restarts: each lead session writes down where it stands, and a successor on the new Mac checks that against git.',
    ],
  },
  {
    q: 'Does machine-transfer use SSH?',
    a: [
      "No, by default it doesn't turn on SSH or Remote Login between the two Macs, because SSH gives the other side the whole user account. It moves files over GitHub, with a private repo for small files and age-encrypted archives for private ones, and over Syncthing, kept on your LAN, for large folders.",
    ],
  },
  {
    q: 'Does machine-transfer copy my sign-ins?',
    a: [
      "No, credentials never travel: you sign in again on the new Mac, and service keys are made fresh there. Some providers track an OAuth grant per user and app, not per machine, so revoke the old machine's grant first and then create the new one.",
    ],
  },
];

/** The answer as plain text: what the page shows, and what the FAQPage JSON-LD carries */
export function answerText(parts: readonly Part[]): string {
  return parts.map((part: Part): string => (typeof part === 'string' ? part : part.text)).join('');
}

/** The answer as Markdown, for /llms.txt */
export function answerMarkdown(parts: readonly Part[]): string {
  return parts
    .map((part: Part): string => (typeof part === 'string' ? part : `[${part.text}](${part.href})`))
    .join('');
}

/** The questions as {q, a} strings, for faqPage() in src/data/schema.ts */
export function plainFaq(items: readonly FaqItem[]): { q: string; a: string }[] {
  return items.map((item: FaqItem) => ({ q: item.q, a: answerText(item.a) }));
}
