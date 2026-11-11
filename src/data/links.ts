// The extension lets Node load this file in scripts/links.test.mjs (Astro and Vite accept it too)
import { siteUrl } from './projects.ts';

// Operator's rule for n-uf.com (2026-11-11): "All external links should open in a new window."
// External = an http(s) link to another host than n-uf.com (GitHub, npm, the n-uf subdomain sites). rel="noopener"
// without "noreferrer": the sites we link to may see the visit came from here, as on debugsy's site.

const siteHost: string = new URL(siteUrl).host;

/**
 * True for an http(s) link to another host. Links without a host, links to n-uf.com itself and links that open no
 * page (mailto:, tel:) are not external.
 */
export function isExternal(href: string): boolean {
  try {
    const url = new URL(href, siteUrl);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.host !== siteHost;
  } catch {
    return false;
  }
}

/** The attributes an external link gets: spread them on the <a>. */
export function externalAttrs(href: string): { target?: string; rel?: string } {
  return isExternal(href) ? { target: '_blank', rel: 'noopener' } : {};
}

/** Text for screen readers after an external link's own text. */
export const newTabNote: string = ' (opens in a new tab)';
