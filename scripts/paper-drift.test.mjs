// The article sheets copy a few styles that the /papyrus page keeps in scoped <style> blocks (the top bar's buttons, the
// breadcrumb, the code box); see the header of src/styles/article.css. This reads the papyrus hub's files, never
// changes them, and fails when a value they changed is no longer the one copied, so the two papers cannot drift apart
// unnoticed. Run: node --test scripts/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFileSync(join(root, file), "utf8");

/**
 * Every rule of the CSS (comments removed) as { selector, decls: { property: value }, media }, where `media` is true for a
 * rule inside an @media block (the narrow-screen and print variants are not the ones that are copied).
 */
function rulesOf(css, media = false) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules = [];
  let at = 0;
  while (at < text.length) {
    const open = text.indexOf("{", at);
    if (open < 0) break;
    let depth = 1;
    let close = open + 1;
    for (; close < text.length && depth > 0; close++) {
      if (text[close] === "{") depth++;
      else if (text[close] === "}") depth--;
    }
    const prelude = text.slice(at, open).trim().replace(/\s+/g, " ");
    const body = text.slice(open + 1, close - 1);
    if (prelude.startsWith("@")) {
      rules.push(...rulesOf(body, true));
    } else {
      const decls = {};
      for (const decl of body.split(";")) {
        const colon = decl.indexOf(":");
        if (colon > 0) decls[decl.slice(0, colon).trim()] = decl.slice(colon + 1).trim().replace(/\s+/g, " ");
      }
      rules.push({ selector: prelude, decls, media });
    }
    at = close;
  }
  return rules;
}

/** The declarations of every rule outside @media with exactly this selector, merged. */
function declsOf(rules, selector, where) {
  const found = rules.filter((rule) => rule.selector === selector && !rule.media);
  assert.ok(found.length > 0, `${where} has no rule "${selector}" any more: the copy in src/styles/article.css may be stale`);
  return Object.assign({}, ...found.map((rule) => rule.decls));
}

const styleBlocks = (file) => [...read(file).matchAll(/<style(?![^>]*\bis:inline\b)[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
const theirPage = rulesOf(styleBlocks("src/pages/papyrus.astro"));
const theirCode = rulesOf(styleBlocks("src/components/PapyrusCode.astro"));
const mine = rulesOf(read("src/styles/article.css"));

/** Asserts that each property of `props` has the same value in their rule and in ours. */
function same({ their, theirSelector, theirWhere, mineSelector, props, ours = props }) {
  const a = declsOf(their, theirSelector, theirWhere);
  const b = declsOf(mine, mineSelector, "src/styles/article.css");
  props.forEach((prop, i) => {
    const mineProp = ours[i];
    assert.ok(prop in a, `${theirWhere} "${theirSelector}" has no ${prop} any more`);
    assert.equal(
      b[mineProp],
      a[prop],
      `${theirWhere} "${theirSelector}" ${prop} is now "${a[prop]}", but src/styles/article.css "${mineSelector}" ${mineProp} is "${b[mineProp]}": copy the new value`,
    );
  });
}

const PAGE = "src/pages/papyrus.astro";
const CODE = "src/components/PapyrusCode.astro";

test("the top bar's buttons: .repo", () => {
  const props = ["display", "flex-wrap", "align-items", "gap", "max-width", "margin", "border", "border-radius", "background", "color", "font-family", "font-size", "line-height", "white-space", "text-align", "text-decoration", "cursor", "transition"];
  same({ their: theirPage, theirSelector: ".repo", theirWhere: PAGE, mineSelector: ".article .repo", props });
  // the padding of the buttons in the bar is a rule of its own there
  same({ their: theirPage, theirSelector: ".view-tools .repo", theirWhere: PAGE, mineSelector: ".article .repo", props: ["padding"] });
  same({ their: theirPage, theirSelector: ".repo[hidden]", theirWhere: PAGE, mineSelector: ".article .repo[hidden]", props: ["display"] });
  same({ their: theirPage, theirSelector: ".repo-path", theirWhere: PAGE, mineSelector: ".article .repo-path", props: ["color", "overflow-wrap"] });
});

test("the buttons' hover and focus", () => {
  same({ their: theirPage, theirSelector: ".repo:is(:hover, :focus-visible)", theirWhere: PAGE, mineSelector: ".article .repo:is(:hover, :focus-visible)", props: ["border-color", "background"] });
  same({ their: theirPage, theirSelector: ".repo:focus-visible", theirWhere: PAGE, mineSelector: ".article .repo:focus-visible", props: ["outline", "outline-offset"] });
});

test("the main action: .repo.pdf-link, its hover and focus", () => {
  same({ their: theirPage, theirSelector: ".repo.pdf-link", theirWhere: PAGE, mineSelector: ".article .repo.pdf-link", props: ["border-color", "background"] });
  same({ their: theirPage, theirSelector: ".repo.pdf-link .repo-path", theirWhere: PAGE, mineSelector: ".article .repo.pdf-link .repo-path", props: ["color"] });
  same({ their: theirPage, theirSelector: ".repo.pdf-link:is(:hover, :focus-visible)", theirWhere: PAGE, mineSelector: ".article .repo.pdf-link:is(:hover, :focus-visible)", props: ["border-color", "background"] });
  same({ their: theirPage, theirSelector: ".repo.pdf-link:focus-visible", theirWhere: PAGE, mineSelector: ".article .repo.pdf-link:focus-visible", props: ["outline", "outline-offset"] });
});

test("the breadcrumb: .crumbs, its links, hover and current item", () => {
  same({ their: theirPage, theirSelector: ".crumbs", theirWhere: PAGE, mineSelector: ".article .crumbs", props: ["display", "gap", "color", "font-size", "line-height"] });
  same({ their: theirPage, theirSelector: ".crumbs a", theirWhere: PAGE, mineSelector: ".article .crumbs a", props: ["text-decoration", "color"] });
  same({ their: theirPage, theirSelector: ".crumbs a:is(:hover, :focus-visible)", theirWhere: PAGE, mineSelector: ".article .crumbs a:is(:hover, :focus-visible)", props: ["color"] });
  same({ their: theirPage, theirSelector: ".crumbs [aria-current]", theirWhere: PAGE, mineSelector: ".article .crumbs [aria-current]", props: ["color"] });
});

test("the code box in the page view: the box, its code and its wrapping", () => {
  // the box and the quiet text colour (their --code-text is our color)
  same({ their: theirCode, theirSelector: ".code-box", theirWhere: CODE, mineSelector: ".article .leaf-body pre", props: ["border", "border-radius", "background"] });
  same({ their: theirCode, theirSelector: ".code-box", theirWhere: CODE, mineSelector: ".article .leaf-body pre", props: ["--code-text"], ours: ["color"] });
  // the code inside it
  same({ their: theirCode, theirSelector: ".code-box :global(pre.astro-code)", theirWhere: CODE, mineSelector: ".article .leaf-body pre", props: ["padding", "font-family", "tab-size"] });
  // a sheet has no scrolling: the page view's size and wrapping
  const pageView = ":global(.doc[data-view='pages']) .code-box :global(pre.astro-code)";
  same({ their: theirCode, theirSelector: pageView, theirWhere: CODE, mineSelector: ".article .leaf-body pre", props: ["font-size", "line-height"] });
  same({ their: theirCode, theirSelector: pageView, theirWhere: CODE, mineSelector: ".article .leaf.paged pre", props: ["overflow", "white-space", "overflow-wrap"] });
});

test("the page view's type on a sheet: the sizes of text, headings and lists", () => {
  // these live in papyrus.astro's page-view rules; ours are on the leaf body
  same({ their: theirPage, theirSelector: ".doc[data-view='pages'] :is(p, li)", theirWhere: PAGE, mineSelector: ".article .leaf-body :is(p, li)", props: ["font-size", "line-height"] });
  same({ their: theirPage, theirSelector: ".doc[data-view='pages'] h2", theirWhere: PAGE, mineSelector: ".article .leaf-body h2", props: ["margin", "font-size"] });
  // their margin-bottom is the last value of our margin shorthand ("0 0 14px")
  const theirP = declsOf(theirPage, ".doc[data-view='pages'] p", PAGE);
  const ourP = declsOf(mine, ".article .leaf-body p", "src/styles/article.css");
  assert.equal(ourP.margin.split(" ").at(-1), theirP["margin-bottom"], `${PAGE} page-view p margin-bottom is now "${theirP["margin-bottom"]}", but src/styles/article.css ".article .leaf-body p" margin is "${ourP.margin}"`);
});
