// Structured data (JSON-LD) nodes for the articles. The Organization node itself comes from Layout.astro; articles
// point to it by id as author and publisher, and to their project's SoftwareSourceCode node with "about".
// The extension lets Node load this file in scripts/projects-npm.test.mjs (Astro and Vite accept it too)
import { npmUrl, siteUrl, studioId, type Project } from './projects.ts';

type Node = Record<string, unknown>;

const context: string = 'https://schema.org';
const day = (date: Date): string => date.toISOString().slice(0, 10);

/** "/papyrus/x" -> "https://n-uf.com/papyrus/x" */
export const absolute = (path: string): string => new URL(path, siteUrl).href;

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbList(crumbs: readonly Crumb[]): Node {
  return {
    '@context': context,
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb: Crumb, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absolute(crumb.path),
    })),
  };
}

/**
 * The home page's list of projects. Each list item holds the project as a SoftwareSourceCode node (not
 * SoftwareApplication, which Google wants offers and ratings for): its own site as url, its repository, the n-uf
 * Organization as author. `sameAs` names the project's main npm package only; the other packages are parts of it.
 * The ListItem wrapper carries just position and item. Projects with no package on npm get neither sameAs nor hasPart.
 */
export function projectItemList(projects: readonly Project[]): Node {
  return {
    '@context': context,
    '@type': 'ItemList',
    name: 'n-uf projects',
    itemListElement: projects.map((project: Project, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareSourceCode',
        name: project.name,
        url: project.url,
        description: project.tagline,
        ...(project.repo !== undefined && { codeRepository: project.repo }),
        author: { '@id': studioId },
        ...(project.npm !== undefined && { sameAs: [npmUrl(project.npm[0])] }),
        ...(project.npm !== undefined &&
          project.npm.length > 1 && {
            hasPart: project.npm.slice(1).map((name: string) => ({
              '@type': 'SoftwareSourceCode',
              name,
              url: npmUrl(name),
            })),
          }),
      },
    })),
  };
}

export function faqPage(faq: readonly { q: string; a: string }[]): Node {
  return {
    '@context': context,
    '@type': 'FAQPage',
    mainEntity: faq.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

export interface ArticleInfo {
  path: string;
  headline: string;
  description: string;
  published: Date;
  updated: Date;
  /** The share image as a site path */
  image: string;
  /** The @id of the project's SoftwareSourceCode node */
  aboutId: string;
}

export function techArticle(info: ArticleInfo): Node {
  const url: string = absolute(info.path);
  return {
    '@context': context,
    '@type': 'TechArticle',
    '@id': `${url}#article`,
    url,
    headline: info.headline,
    description: info.description,
    image: absolute(info.image),
    datePublished: day(info.published),
    dateModified: day(info.updated),
    inLanguage: 'en',
    author: { '@id': studioId },
    publisher: { '@id': studioId },
    mainEntityOfPage: url,
    about: { '@id': info.aboutId },
  };
}

export interface NoteInfo {
  path: string;
  headline: string;
  description: string;
  published: Date;
  updated: Date;
  /** The share image as a site path */
  image: string;
  /** The section the note is filed under ("Claude", "Web interfaces") */
  section: string;
}

/**
 * A note: an Article by the n-uf Organization (author and publisher both the shared id; the node itself comes from
 * Layout.astro). A note belongs to no project, so it has no "about".
 */
export function noteArticle(info: NoteInfo): Node {
  const url: string = absolute(info.path);
  return {
    '@context': context,
    '@type': 'Article',
    '@id': `${url}#article`,
    url,
    headline: info.headline,
    description: info.description,
    image: absolute(info.image),
    datePublished: day(info.published),
    dateModified: day(info.updated),
    inLanguage: 'en',
    articleSection: info.section,
    author: { '@id': studioId },
    publisher: { '@id': studioId },
    mainEntityOfPage: url,
  };
}

/** The notes index: a Blog whose posts are the notes the build shows, newest first */
export function notesBlog(info: {
  path: string;
  name: string;
  description: string;
  posts: readonly { path: string; headline: string; published: Date }[];
}): Node {
  const url: string = absolute(info.path);
  return {
    '@context': context,
    '@type': 'Blog',
    '@id': `${url}#blog`,
    url,
    name: info.name,
    description: info.description,
    inLanguage: 'en',
    publisher: { '@id': studioId },
    blogPost: info.posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.headline,
      url: absolute(post.path),
      datePublished: day(post.published),
      author: { '@id': studioId },
    })),
  };
}
