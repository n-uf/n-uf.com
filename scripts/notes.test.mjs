// Tests for the notes section (src/data/note-schema.ts, src/data/notes.mjs): the schema's limits, the list and the feed
// holding live notes only, and the publish flip reaching src/content/notes. The built site's empty state (no /notes, no
// feed, nothing in the sitemap while no note is live) is tested in scripts/notes-build.test.mjs.
// The one fixture note is a draft, in scripts/fixtures/notes (not in src/content, so no build ever shows it).
// Run: node --test scripts/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { noteSchema } from "../src/data/note-schema.ts";
import {
  NOTES_DESCRIPTION,
  NOTES_FEED_PATH,
  NOTES_PATH,
  NOTES_TITLE,
  isLiveEntry,
  notePath,
  rssFeed,
  visibleNotes,
} from "../src/data/notes.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, "fixtures", "notes");
const FIXTURE = "src/content/notes/fixture-draft-note.md";

// astro's own YAML parser (a dependency of astro, so no new package): the front matter as Astro reads it
const yaml = createRequire(createRequire(import.meta.url).resolve("astro/package.json"))("yaml");
const frontMatter = (text) => yaml.parse(text.match(/^---\n([\s\S]*?)\n---\n/)[1]);
const fixtureData = () => frontMatter(readFileSync(join(fixtures, FIXTURE), "utf8"));
const parse = (data) => noteSchema.safeParse(data);
/** the fixture with some fields changed (undefined removes one) */
const withFields = (changes) => {
  const data = { ...fixtureData(), ...changes };
  for (const key of Object.keys(changes)) if (changes[key] === undefined) delete data[key];
  return data;
};
const failsOn = (changes, path, message) => {
  const r = parse(withFields(changes));
  assert.equal(r.success, false, `expected the schema to refuse ${JSON.stringify(changes).slice(0, 80)}`);
  const issue = r.error.issues.find((i) => i.path.join(".").startsWith(path));
  assert.ok(issue, `no issue at "${path}": ${JSON.stringify(r.error.issues.map((i) => [i.path.join("."), i.message]))}`);
  if (message) assert.match(issue.message, message);
};

// ---- the schema
test("the fixture note is a valid draft, with every field the schema knows", () => {
  const r = parse(fixtureData());
  assert.equal(r.success, true, r.error?.message);
  assert.equal(r.data.draft, true);
  assert.equal(r.data.topic, "claude");
  assert.equal(r.data.kind, "test");
  assert.ok(r.data.tested instanceof Date);
  assert.equal(r.data.repro, "https://github.com/n-uf/fixture-repro");
  assert.equal(r.data.faq.length, 1);
  assert.equal(r.data.sources.length, 1);
});

test("a title over 60 characters and a description outside 120 to 155 fail, at the limits they pass", () => {
  assert.equal(parse(withFields({ title: "x".repeat(60) })).success, true);
  failsOn({ title: "x".repeat(61) }, "title");
  assert.equal(parse(withFields({ description: "d".repeat(120) })).success, true);
  assert.equal(parse(withFields({ description: "d".repeat(155) })).success, true);
  failsOn({ description: "d".repeat(119) }, "description");
  failsOn({ description: "d".repeat(156) }, "description");
});

test("the index page's own title and description keep the same limits", () => {
  assert.ok(NOTES_TITLE.length <= 60, `title is ${NOTES_TITLE.length}`);
  assert.ok(NOTES_DESCRIPTION.length >= 120 && NOTES_DESCRIPTION.length <= 155, `description is ${NOTES_DESCRIPTION.length}`);
});

test("h1, main keyword, author, topic and kind are checked", () => {
  failsOn({ h1: "too short" }, "h1");
  failsOn({ h1: "h".repeat(91) }, "h1");
  failsOn({ mainKeyword: "ab" }, "mainKeyword");
  failsOn({ author: "someone" }, "author");
  failsOn({ topic: "react" }, "topic");
  failsOn({ topic: undefined }, "topic");
  failsOn({ kind: "news" }, "kind");
  for (const kind of ["how-to", "what-is", "comparison", "best-tools", "use-case", "test", "log"]) {
    assert.equal(parse(withFields({ kind })).success, true, kind);
  }
  assert.equal(parse(withFields({ topic: "web-ui" })).success, true);
});

test("evidence is required, one short line", () => {
  failsOn({ evidence: undefined }, "evidence");
  failsOn({ evidence: "too short" }, "evidence");
  failsOn({ evidence: "e".repeat(221) }, "evidence");
});

test("a note of kind test needs `tested`; any other kind may leave it out; a test day ahead is refused", () => {
  failsOn({ tested: undefined }, "tested", /kind "test" needs `tested`/);
  assert.equal(parse(withFields({ kind: "how-to", tested: undefined })).success, true);
  failsOn({ tested: "2999-01-01" }, "tested", /future day/);
  failsOn({ tested: "yesterday-ish" }, "tested");
});

test("repro must be a link", () => {
  failsOn({ repro: "see the repo" }, "repro");
  assert.equal(parse(withFields({ repro: undefined })).success, true);
});

test("takeaways: 3 to 5, each 20 characters or more", () => {
  const t = (n) => Array.from({ length: n }, (_, i) => `Takeaway number ${i + 1}, long enough for the schema.`);
  failsOn({ takeaways: t(2) }, "takeaways");
  failsOn({ takeaways: t(6) }, "takeaways");
  failsOn({ takeaways: [...t(2), "short"] }, "takeaways");
  assert.equal(parse(withFields({ takeaways: t(3) })).success, true);
  assert.equal(parse(withFields({ takeaways: t(5) })).success, true);
});

test("the FAQ is optional, at most 5, and each question ends in ? with an answer of 40 characters or more", () => {
  const q = (n) => Array.from({ length: n }, (_, i) => ({ q: `Question ${i + 1}?`, a: "An answer that is long enough for the forty characters." }));
  assert.deepEqual(parse(withFields({ faq: undefined })).data.faq, []);
  assert.equal(parse(withFields({ faq: q(5) })).success, true);
  failsOn({ faq: q(6) }, "faq");
  failsOn({ faq: [{ q: "No question mark", a: "An answer that is long enough for the forty characters." }] }, "faq");
  failsOn({ faq: [{ q: "A question?", a: "Too short." }] }, "faq");
});

test("sources need a title, a link and a checked date; none is fine", () => {
  assert.deepEqual(parse(withFields({ sources: undefined })).data.sources, []);
  failsOn({ sources: [{ title: "No link", checked: "2026-11-20" }] }, "sources");
  failsOn({ sources: [{ title: "No date", url: "https://example.com/" }] }, "sources");
  failsOn({ sources: [{ title: "Bad link", url: "not a url", checked: "2026-11-20" }] }, "sources");
});

test("related: 2 to 4 site paths in lower case, and /notes must be one of them", () => {
  failsOn({ related: ["/notes"] }, "related");
  failsOn({ related: ["/notes", "/papyrus", "/harbuz", "/kavun", "/dynia"] }, "related");
  failsOn({ related: ["/papyrus", "/harbuz"] }, "related", /needs \/notes/);
  failsOn({ related: ["/notes", "/Papyrus"] }, "related");
  failsOn({ related: ["/notes", "https://example.com/x"] }, "related");
  assert.deepEqual(parse(withFields({ related: ["/notes/", "/papyrus/"] })).data.related, ["/notes", "/papyrus"]); // trailing slash removed
});

test("actions: at most 2", () => {
  const a = (n) => Array.from({ length: n }, () => ({ heading: "A heading to use", text: "One plain sentence about what the product does for this need.", label: "Get the tool", href: "https://n-uf.com/papyrus" }));
  assert.equal(parse(withFields({ actions: a(2) })).success, true);
  failsOn({ actions: a(3) }, "actions");
});

test("dates: updated may not be earlier than published; a live note can't be dated ahead, a draft can", () => {
  failsOn({ published: "2026-12-02", updated: "2026-12-01" }, "updated", /earlier than published/);
  assert.equal(parse(withFields({ published: "2999-01-01", updated: "2999-01-01", draft: true })).success, true);
  failsOn({ published: "2999-01-01", updated: "2999-01-01", draft: false }, "published", /future date but the note is not a draft/);
  assert.equal(parse(withFields({ published: "2026-11-01", updated: "2026-11-02", draft: false })).success, true);
});

test("{{live:}} markers are refused in front matter", () => {
  failsOn({ evidence: "A test that links {{live:/notes/x}}a later note{{/live}} from front matter." }, "", /blocks work only in the markdown body/);
});

// ---- the list and the feed hold live notes only
const entry = (id, changes = {}) => {
  const r = parse({ ...fixtureData(), ...changes });
  assert.equal(r.success, true, `${id}: ${r.error?.message}`);
  return { id, data: r.data };
};
const live = (id, published, extra = {}) => entry(id, { draft: false, published, updated: published, title: `Note ${id}`, ...extra });
const draft = entry("later", { title: "Note later" }); // the fixture itself: a draft dated 2026-12-01
const entries = () => [live("older", "2026-11-10"), draft, live("newest", "2026-11-20"), live("middle", "2026-11-15")];

test("the one rule for live is `draft !== true`", () => {
  assert.equal(isLiveEntry({ data: { draft: true } }), false);
  assert.equal(isLiveEntry({ data: { draft: false } }), true);
  assert.equal(isLiveEntry({ data: {} }), true);
});

test("the index lists live notes only, newest first, in production", () => {
  assert.deepEqual(visibleNotes(entries(), false).map((e) => e.id), ["newest", "middle", "older"]);
});

test("a preview also lists the draft; it is the newest because it is scheduled latest", () => {
  assert.deepEqual(visibleNotes(entries(), true).map((e) => e.id), ["later", "newest", "middle", "older"]);
});

test("notes of the same day keep their order by the day they changed, then by title", () => {
  const a = live("a", "2026-11-10", { updated: "2026-11-12", title: "Zed" });
  const b = live("b", "2026-11-10", { updated: "2026-11-11", title: "Alpha" });
  const c = live("c", "2026-11-10", { updated: "2026-11-11", title: "Beta" });
  assert.deepEqual(visibleNotes([c, b, a], false).map((e) => e.id), ["a", "b", "c"]);
});

test("with no live note, production lists nothing (and so builds no index), while a preview lists the draft", () => {
  assert.deepEqual(visibleNotes([draft], false), []);
  assert.deepEqual(visibleNotes([], false), []);
  assert.equal(visibleNotes([draft], true).length, 1);
});

const SITE = "https://n-uf.com";
test("the feed holds live notes only: a draft has no item, no link and no title in it", () => {
  const xml = rssFeed({ siteUrl: SITE, entries: visibleNotes(entries(), false) });
  assert.equal((xml.match(/<item>/g) ?? []).length, 3);
  for (const id of ["newest", "middle", "older"]) assert.ok(xml.includes(`<link>${SITE}${notePath(id)}</link>`), id);
  assert.ok(!xml.includes("/notes/later"));
  assert.ok(!xml.includes("Note later"));
  assert.ok(!/scheduled for/.test(xml));
});

test("the feed is RSS 2.0 with a self link, permalink guids, the published day as pubDate and the topic as category", () => {
  const xml = rssFeed({ siteUrl: SITE, entries: visibleNotes(entries(), false) });
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<rss version="2.0" xmlns:atom="http:\/\/www.w3.org\/2005\/Atom"/);
  assert.ok(xml.includes(`<atom:link href="${SITE}${NOTES_FEED_PATH}" rel="self" type="application/rss+xml" />`));
  assert.ok(xml.includes(`<link>${SITE}${NOTES_PATH}</link>`));
  assert.ok(xml.includes(`<guid isPermaLink="true">${SITE}/notes/newest</guid>`));
  assert.ok(xml.includes("<pubDate>Fri, 20 Nov 2026 00:00:00 GMT</pubDate>"));
  assert.ok(xml.includes("<category>Claude</category>"));
  assert.ok(xml.indexOf("/notes/newest<") < xml.indexOf("/notes/middle<") && xml.indexOf("/notes/middle<") < xml.indexOf("/notes/older<"), "newest first");
  assert.ok(xml.includes("<lastBuildDate>Fri, 20 Nov 2026 00:00:00 GMT</lastBuildDate>"), "the newest `updated`, not the build time");
});

test("an item carries the description and the takeaways, escaped, backticks removed", () => {
  const e = live("code", "2026-11-18", { title: "Using `a & b` <now>", takeaways: ["Run `ps` & read the RSS <column> of each session.", "Second takeaway, long enough to pass.", "Third takeaway, long enough to pass."] });
  const xml = rssFeed({ siteUrl: SITE, entries: [e] });
  assert.ok(xml.includes("<title>Using a &amp; b &lt;now&gt;</title>"));
  assert.ok(xml.includes("&lt;li&gt;Run ps &amp;amp; read the RSS &amp;lt;column&amp;gt; of each session.&lt;/li&gt;"));
  assert.doesNotMatch(xml, /<column>|`/);
});

test("a preview's feed marks the draft as scheduled; with no entry the feed is empty but valid", () => {
  const xml = rssFeed({ siteUrl: SITE, entries: visibleNotes(entries(), true) });
  assert.ok(xml.includes("<title>Note later (scheduled for 2026-12-01)</title>"));
  const empty = rssFeed({ siteUrl: SITE, entries: [] });
  assert.ok(!empty.includes("<item>") && !empty.includes("lastBuildDate") && empty.endsWith("</rss>\n"));
});

// ---- scheduled publishing reaches the notes folder
test("publish-due flips a due draft note, and the publish guard accepts that patch (src/content/notes)", () => {
  const root = mkdtempSync(join(tmpdir(), "notes-flip-"));
  cpSync(fixtures, root, { recursive: true });
  const git = (...args) => execFileSync("git", ["-C", root, "-c", "user.email=t@t", "-c", "user.name=t", "-c", "commit.gpgsign=false", ...args], { encoding: "utf8" });
  git("init", "-q");
  git("add", "-A");
  git("commit", "-qm", "the draft note");
  // before its day: nothing is due
  const dry = (today) => execFileSync("node", [join(here, "publish-due.mjs"), "--root", root, "--today", today, "--dry-run"], { encoding: "utf8" });
  assert.equal(dry("2026-11-30"), "");
  assert.equal(dry("2026-12-01"), "notes/fixture-draft-note\n");
  // on its day: flipped, and only the draft line changed
  execFileSync("node", [join(here, "publish-due.mjs"), "--root", root, "--today", "2026-12-01"], { encoding: "utf8" });
  const after = readFileSync(join(root, FIXTURE), "utf8");
  assert.equal(after, readFileSync(join(fixtures, FIXTURE), "utf8").replace("draft: true", "draft: false"));
  const patch = git("diff", "--no-color", "--no-ext-diff", "--no-renames", "--src-prefix=a/", "--dst-prefix=b/");
  assert.match(patch, /^diff --git a\/src\/content\/notes\/fixture-draft-note\.md b\/src\/content\/notes\/fixture-draft-note\.md/);
  writeFileSync(join(root, "p.patch"), patch);
  writeFileSync(join(root, "p.pages"), "notes/fixture-draft-note\n");
  const guard = spawnSync("python3", ["-I", join(here, "check-publish-patch.py"), "--root", root, "--today", "2026-12-01", join(root, "p.patch"), join(root, "p.pages")], { encoding: "utf8" });
  assert.equal(guard.status, 0, guard.stderr);
  assert.equal(guard.stdout, "publish: notes/fixture-draft-note\n");
  // the day before, the guard refuses the same patch: a draft is never flipped early
  const early = spawnSync("python3", ["-I", join(here, "check-publish-patch.py"), "--root", root, "--today", "2026-11-30", join(root, "p.patch"), join(root, "p.pages")], { encoding: "utf8" });
  assert.equal(early.status, 1);
  assert.match(early.stderr, /isn't due: published 2026-12-01/);
});
