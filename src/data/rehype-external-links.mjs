// A rehype step for the articles' markdown: a link to another host opens in a new tab (operator rule for n-uf.com,
// 2026-11-11: "All external links should open in a new window"), with rel="noopener" (no noreferrer: the sites we
// link to may see the visit came from here), the small drawn arrow after the text (src/data/ext-arrow.mjs) and a note
// for screen readers, as the ExtLink component gives the hand-written links (src/components/ExtLink.astro).
// Inside a heading (h1-h6) the link still opens in a new tab, but gets neither the arrow nor the note: Astro makes the
// heading's id from its text after this step, and the contents list reads the same text, so they would end up in both.
// Plain JS (its one import is plain JS too), so that scripts/rehype-external-links.test.mjs can run it;
// astro.config.mjs passes in `isExternal` and the note from links.ts, the one definition of "external" for the site.

import { EXT_ARROW_PATH, EXT_ARROW_STROKE, EXT_ARROW_VIEWBOX } from './ext-arrow.mjs';

/** The arrow as a hast tree: a span (for spacing and colour) around the SVG, hidden from assistive tech */
export const extArrow = () => ({
  type: 'element',
  tagName: 'span',
  properties: { className: ['ext-arrow'], ariaHidden: 'true' },
  children: [
    {
      type: 'element',
      tagName: 'svg',
      properties: { viewBox: EXT_ARROW_VIEWBOX, width: '10', height: '10', focusable: 'false' },
      children: [
        {
          type: 'element',
          tagName: 'path',
          properties: { d: EXT_ARROW_PATH, fill: 'none', stroke: 'currentColor', strokeWidth: EXT_ARROW_STROKE, strokeLinecap: 'square' },
          children: [],
        },
      ],
    },
  ],
});

/**
 * @param {{ isExternal: (href: string) => boolean, note: string }} options
 * @returns {() => (tree: object) => void} a rehype plugin
 */
export default function rehypeExternalLinks({ isExternal, note }) {
  const text = (value) => ({ type: 'text', value });
  const span = (properties, value) => ({ type: 'element', tagName: 'span', properties, children: [text(value)] });
  return () => {
    const visit = (node, inHeading) => {
      const heading = inHeading || (node.type === 'element' && /^h[1-6]$/.test(node.tagName));
      if (node.type === 'element' && node.tagName === 'a' && typeof node.properties?.href === 'string' && isExternal(node.properties.href)) {
        node.properties.target = '_blank';
        node.properties.rel = ['noopener'];
        if (!heading) {
          node.children.push(extArrow(), span({ className: ['sr-only'] }, note));
        }
      }
      for (const child of node.children ?? []) visit(child, heading);
    };
    return (tree) => visit(tree, false);
  };
}
