import type { APIRoute } from "astro";
import {
  githubOrgUrl,
  npmUrl,
  projects,
  siteUrl,
  studioAlternateNames,
  studioName,
  studioSummary,
  type Project,
} from "../data/projects";
import { plainText } from "../data/inline-code.mjs";
import { answerMarkdown, homeFaq, machineTransferFaq, type FaqItem } from "../data/faq";
import { articlePath, getArticles, getNotes, sections, type Entry, type NoteEntry, type SectionKey } from "../data/articles";
import { kitOf } from "../data/kits";
// @ts-ignore: plain JS module, so the tests can run it without Astro
import { NOTES_DESCRIPTION, NOTES_FEED_PATH, NOTES_PATH, notePath } from "../data/notes.mjs";

// The live articles of each project that has a collection, listed under that project (drafts only in previews);
// a kit's are its guides
const articleLines: Record<string, string[]> = {};
for (const key of Object.keys(sections) as SectionKey[]) {
  const entries: Entry[] = await getArticles(key);
  if (entries.length > 0) {
    articleLines[key] = [
      `- ${sections[key].listLabel}:`,
      ...entries.map(
        (entry: Entry) =>
          `  - [${plainText(entry.data.h1)}](${new URL(articlePath(key, entry.id), siteUrl).href}): ${plainText(entry.data.description)}`,
      ),
    ];
  }
}

// The notes section, listed only while this build shows a note (live ones; drafts in previews): with none, the section
// has no page, so llms.txt does not mention it or its feed
const notes: NoteEntry[] = await getNotes();
const notesBlock: string[] =
  notes.length === 0
    ? []
    : [
        "## Notes",
        "",
        NOTES_DESCRIPTION,
        "",
        `- Index: ${new URL(NOTES_PATH, siteUrl).href}`,
        `- Feed (RSS): ${new URL(NOTES_FEED_PATH, siteUrl).href}`,
        ...notes.map(
          (entry: NoteEntry) =>
            `- [${plainText(entry.data.h1)}](${new URL(notePath(entry.id), siteUrl).href}): ${plainText(entry.data.description)}`,
        ),
        "",
      ];

function projectBlock(project: Project): string {
  const lines: string[] = [
    `### ${project.name}`,
    "",
    project.tagline,
    "",
    project.description,
    "",
    `- Status: ${project.status}`,
    `- Site: ${project.url}`,
  ];
  if (project.repo !== undefined) {
    lines.push(`- Repository: ${project.repo}`);
  }
  if (project.npm !== undefined) {
    lines.push(`- npm: ${project.npm.map((name: string) => `[${name}](${npmUrl(name)})`).join(", ")}`);
  }
  const kit = kitOf(project.id);
  if (kit !== undefined) {
    lines.push(`- Guides page: ${new URL(kit.path, siteUrl).href}`);
  }
  lines.push(...(articleLines[project.id] ?? []));
  return lines.join("\n");
}

// The questions the pages show (src/data/faq.ts), with their links as Markdown
function faqBlock(items: readonly FaqItem[]): string {
  return items.map((item: FaqItem) => `### ${item.q}\n\n${answerMarkdown(item.a)}`).join("\n\n");
}

export const GET: APIRoute = (): Response => {
  const body: string = [
    `# ${studioName}`,
    "",
    `> ${studioSummary}`,
    "",
    `Also written: ${studioAlternateNames.join(", ")}`,
    `Organisation site: ${siteUrl}`,
    `GitHub: ${githubOrgUrl}`,
    "",
    "## Projects",
    "",
    projects.map(projectBlock).join("\n\n"),
    "",
    ...notesBlock,
    "## Questions about n-uf",
    "",
    faqBlock(homeFaq),
    "",
    "## Questions about machine-transfer",
    "",
    faqBlock(machineTransferFaq),
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
