import type { APIRoute } from "astro";
import {
  githubOrgUrl,
  projects,
  siteUrl,
  studioName,
  studioSummary,
  type Project,
} from "../data/projects";

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
  return lines.join("\n");
}

export const GET: APIRoute = (): Response => {
  const body: string = [
    `# ${studioName}`,
    "",
    `> ${studioSummary}`,
    "",
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
