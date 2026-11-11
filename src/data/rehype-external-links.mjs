// A rehype step for the articles' markdown: a link to another host opens in a new tab (operator rule for n-uf.com,
// 2026-11-11: "All external links should open in a new window"), with rel="noopener" (no noreferrer: the sites we
// link to may see the visit came from here) and a note for screen readers after the link text, as the hand-written
// links get (src/data/links.ts). Plain JS with no imports, so that scripts/rehype-external-links.test.mjs can run it;
// astro.config.mjs passes in `isExternal` and the note from links.ts, the one definition of "external" for the site.

/**
 * @param {{ isExternal: (href: string) => boolean, note: string }} options
 * @returns {() => (tree: object) => void} a rehype plugin
 */
export default function rehypeExternalLinks({ isExternal, note }) {
  return () => {
    const visit = (node) => {
      if (node.type === 'element' && node.tagName === 'a' && typeof node.properties?.href === 'string' && isExternal(node.properties.href)) {
        node.properties.target = '_blank';
        node.properties.rel = ['noopener'];
        node.children.push({
          type: 'element',
          tagName: 'span',
          properties: { className: ['sr-only'] },
          children: [{ type: 'text', value: note }],
        });
      }
      for (const child of node.children ?? []) visit(child);
    };
    return visit;
  };
}
