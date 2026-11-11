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
          `  - [${entry.data.h1}](${new URL(articlePath(key, entry.id), siteUrl).href}): ${entry.data.description}`,
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
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
