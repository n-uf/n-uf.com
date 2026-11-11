// The small arrow after an external link, drawn as an SVG rather than typed as "↗": neither Geist nor Geist Mono has
// U+2197, so Chrome borrowed a system font for it (Menlo on a Mac) and the printed PDFs differed from machine to machine.
// One definition for the hand-written links (src/components/ExtLink.astro) and the articles' markdown
// (src/data/rehype-external-links.mjs). Plain JS with no imports, so the rehype tests can load it.

/** A 10x10 box: a diagonal from the lower left to the upper right, and the arrow's head as a corner */
export const EXT_ARROW_VIEWBOX = '0 0 10 10';
export const EXT_ARROW_PATH = 'M2 8 8 2M3.5 2H8v4.5';
export const EXT_ARROW_STROKE = '1.4';
