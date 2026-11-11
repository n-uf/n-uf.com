// Inline `code` in front matter text (takeaways, FAQ, related cards). Front matter is plain text, so a backtick span
// is shown as <code> on the page and as plain text everywhere a machine reads it (meta tags, JSON-LD).
// Backtick spans only: nothing else of markdown is rendered, and everything else is escaped.
// Plain JS with no Astro imports so that scripts/inline-code.test.mjs can run it.

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/**
 * The text as safe HTML: escaped first, then each `span` wrapped in <code>.
 * @param {string} text
 * @returns {string}
 */
export function inlineCodeHtml(text) {
  const escaped = String(text).replace(/[&<>"']/g, (c) => ESCAPES[c]);
  return escaped.replace(/`([^`\n]+)`/g, "<code>$1</code>");
}

/**
 * The text for meta tags and structured data: the backticks removed, nothing else changed.
 * @param {string} text
 * @returns {string}
 */
export function plainText(text) {
  return String(text).replace(/`/g, "");
}
