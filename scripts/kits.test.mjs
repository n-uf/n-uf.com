// Tests for the kits' guides (src/data/kits.ts and src/content/<kit>/*.md): the guides pages stay off the kit homes'
// searches, every guide says the package is private, links its guides page and its kit's own site, and its calls to
// action go to the kit's own host. Run: node --test scripts/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { kitList, kitOf } from "../src/data/kits.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const plain = (text) => text.replace(/`/g, "");
// the searches that belong to the kit homes (seo/products/<kit>/core.json, tab Home), which a guides page must not take
const kitHomeSearches = ["react ui kit", "react pdf viewer component", "react document viewer component"];

/** The front matter and the body of a guide, with the few top-level values these tests read. */
function guide(kit, file) {
  const text = readFileSync(join(root, "src/content", kit, file), "utf8");
  const [, front, body] = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const value = (key) => front.match(new RegExp(`^${key}: "?(.*?)"?$`, "m"))?.[1] ?? null;
  const list = (key) => [...(front.match(new RegExp(`^${key}:\\n((?:  - .*\\n?)+)`, "m"))?.[1] ?? "").matchAll(/^  - (.*)$/gm)].map((m) => m[1]);
  return { file, front, body, value, list };
}
const guides = kitList.flatMap((kit) =>
  readdirSync(join(root, "src/content", kit.id))
    .filter((name) => name.endsWith(".md"))
    .map((name) => ({ kit, ...guide(kit.id, name) })),
);

test("each kit has a guides page at /<kit>, a site on its own subdomain and a name that matches its id", () => {
  assert.deepEqual(kitList.map((kit) => kit.id), ["harbuz", "kavun", "dynia"]);
  for (const kit of kitList) {
    assert.equal(kit.path, `/${kit.id}`);
    assert.equal(kit.siteUrl, `https://${kit.id}.n-uf.com`);
    assert.equal(kit.name, kit.id);
    assert.equal(kitOf(kit.id), kit);
  }
  assert.equal(kitOf("papyrus"), undefined);
});

test("a guides page's title is at most 60 characters, its description 120 to 155, and the h1 repeats the title", () => {
  for (const kit of kitList) {
    assert.ok(kit.title.length <= 60, `${kit.id} title is ${kit.title.length}`);
    assert.ok(kit.description.length >= 120 && kit.description.length <= 155, `${kit.id} description is ${kit.description.length}`);
    assert.equal(kit.h1, kit.title);
  }
});

test("a guides page does not take a search that belongs to the kit's own home", () => {
  for (const kit of kitList) {
    for (const text of [kit.title, kit.h1, kit.description]) {
      for (const search of kitHomeSearches) assert.ok(!text.toLowerCase().includes(search), `${kit.id}: "${text}" has "${search}"`);
    }
  }
});

test("a guides page says the package is private, links no repository and never names pdfized", () => {
  for (const kit of kitList) {
    const all = [kit.title, kit.description, ...kit.about].join(" ");
    assert.doesNotMatch(all, /pdfized/i, kit.id);
    assert.doesNotMatch(all, /github\.com/i, kit.id);
  }
});

test("the share card script draws the guides page with the same h1 as src/data/kits.ts", () => {
  const script = readFileSync(join(root, "scripts/render-og-pages.py"), "utf8");
  for (const kit of kitList) assert.ok(script.includes(`"page_h1": "${kit.h1}"`), `${kit.id}: page_h1 differs from the h1 in kits.ts`);
});

test("there are guides for every kit", () => {
  for (const kit of kitList) assert.ok(guides.some((g) => g.kit === kit), `${kit.id} has no guide`);
});

test("every guide is a use case that says the package is private and not installable yet", () => {
  for (const g of guides) {
    assert.equal(g.value("kind"), "use-case", g.file);
    const everything = plain(g.front + g.body).toLowerCase();
    assert.ok(everything.includes("private"), `${g.kit.id}/${g.file} does not say the package is private`);
    assert.ok(/not (yet )?installable|can't install it yet|cannot install it yet|install .* yet|not (yet )?on a public registry/.test(everything), `${g.kit.id}/${g.file} does not say it is not installable yet`);
    assert.doesNotMatch(everything, /pdfized/, `${g.kit.id}/${g.file} names pdfized`);
    assert.doesNotMatch(everything, /github\.com\/n-uf\/angiospermae/, `${g.kit.id}/${g.file} links the private repository`);
  }
});

test("every guide lists its guides page in `related`, links it and the kit's site in the body", () => {
  for (const g of guides) {
    assert.ok(g.list("related").includes(g.kit.path), `${g.kit.id}/${g.file}: related has no ${g.kit.path}`);
    assert.ok(g.body.includes(`](${g.kit.path})`), `${g.kit.id}/${g.file}: no link to ${g.kit.path}`);
    assert.ok(g.body.includes(`](${g.kit.siteUrl}`), `${g.kit.id}/${g.file}: no link to ${g.kit.siteUrl}`);
  }
});

test("every guide's calls to action go to the kit's own host", () => {
  for (const g of guides) {
    const hrefs = [...g.front.matchAll(/^    href: "(.*)"$/gm)].map((m) => m[1]);
    assert.ok(hrefs.length >= 1 && hrefs.length <= 3, `${g.kit.id}/${g.file}: ${hrefs.length} actions`);
    for (const href of hrefs) assert.equal(new URL(href).host, new URL(g.kit.siteUrl).host, `${g.kit.id}/${g.file}: ${href}`);
  }
});

test("no guide's headings, title or h1 takes another page's main keyword, and its own main keyword is in the title, h1 and first paragraph", () => {
  const keywords = guides.map((g) => g.value("mainKeyword"));
  assert.equal(new Set(keywords).size, keywords.length, "two guides share a main keyword");
  for (const g of guides) {
    const own = g.value("mainKeyword").toLowerCase();
    const headings = (g.body.match(/^## .*$/gm) ?? []).concat(g.value("title"), g.value("h1")).map((h) => plain(h).toLowerCase());
    for (const other of keywords.filter((k) => k !== g.value("mainKeyword"))) {
      for (const h of headings) assert.ok(!h.includes(other.toLowerCase()), `${g.kit.id}/${g.file}: "${h}" has the keyword "${other}"`);
    }
    assert.ok(plain(g.value("title")).toLowerCase().startsWith(own.slice(0, 20)), `${g.file}: the title does not lead with the keyword`);
    assert.ok(plain(g.value("h1")).toLowerCase().includes(own), `${g.file}: h1`);
    assert.ok(plain(g.body.split("\n\n")[0]).toLowerCase().includes(own), `${g.file}: first paragraph`);
  }
});

test("a guide that links a later guide wraps the sentence in a live block", () => {
  for (const g of guides) {
    const draft = /^draft: true$/m.test(g.front);
    const published = g.value("published");
    for (const other of guides.filter((o) => o !== g && o.kit === g.kit)) {
      const path = `/${g.kit.id}/${other.file.slice(0, -3)}`;
      const otherDraft = /^draft: true$/m.test(other.front);
      const later = otherDraft && (!draft || other.value("published") > published);
      const bare = [...g.body.matchAll(new RegExp(`\\]\\(${path}\\)`, "g"))].length;
      const wrapped = g.body.includes(`{{live:${path}}}`);
      if (later && bare > 0) assert.ok(wrapped, `${g.kit.id}/${g.file} links ${path}, a later draft, outside a live block`);
    }
  }
});
