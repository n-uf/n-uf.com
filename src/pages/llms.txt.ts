import type { APIRoute } from "astro";
import {
  githubOrgUrl,
  projects,
  siteUrl,
  studioAlternateNames,
  studioName,
  studioSummary,
  type Project,
} from "../data/projects";
import { plainText } from "../data/inline-code.mjs";
import { answerMarkdown, homeFaq, machineTransferFaq, type FaqItem } from "../data/faq";
import { articlePath, getArticles, sections, type Entry, type SectionKey } from "../data/articles";

// The live articles of each project that has a collection, listed under that project (drafts only in previews)
const articleLines: Record<string, string[]> = {};
for (const key of Object.keys(sections) as SectionKey[]) {
  const entries: Entry[] = await getArticles(key);
  if (entries.length > 0) {
    articleLines[key] = [
      "- Articles:",
      ...entries.map(
        (entry: Entry) =>
          `  - [${plainText(entry.data.h1)}](${new URL(articlePath(key, entry.id), siteUrl).href}): ${plainText(entry.data.description)}`,
      ),
    ];
  }
}

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
    lines.push(`- npm: ${project.npm}`);
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
