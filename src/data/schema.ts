// Structured data (JSON-LD) nodes for the articles. The Organization node itself comes from Layout.astro; articles
// point to it by id as author and publisher, and to their project's SoftwareSourceCode node with "about".
import { siteUrl, studioId } from './projects';

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
