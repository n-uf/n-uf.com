// Tests for scripts/publish-due.mjs on a copy of scripts/fixtures/publish (run: pnpm test).
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, writeFileSync, mkdirSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, "publish-due.mjs");
const fixtures = join(here, "fixtures", "publish");
const TODAY = "2026-11-10";
// what the script lists: <collection>/<slug>, collections in name order (notes/, then papyrus/), files in name order.
// `notes` stands for any later collection: the script finds every folder under src/content, none is named in it.
const DUE = ["notes/crlf-draft", "papyrus/past-draft", "papyrus/today-draft"];

const files = {
  past: "src/content/papyrus/past-draft.md",         // draft, dated before today: flips
  today: "src/content/papyrus/today-draft.md",       // draft, dated today: flips
  future: "src/content/papyrus/future-draft.md",     // draft, dated after today: stays
  live: "src/content/notes/live-page.md",     // draft: false: untouched
  noFlag: "src/content/notes/no-flag.md",     // no draft line: untouched
  crlf: "src/content/notes/crlf-draft.md",    // draft with CRLF line ends, due: flips
};

let root;
const read = (rel) => readFileSync(join(root, rel));
const original = (rel) => readFileSync(join(fixtures, rel));
const run = (...args) => execFileSync("node", [script, "--root", root, "--today", TODAY, ...args], { encoding: "utf8" });
/** the original bytes with only the first `draft: true` turned into `draft: false` */
const flipped = (rel) => Buffer.from(original(rel).toString("latin1").replace("draft: true", "draft: false"), "latin1");

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "publish-due-"));
  cpSync(fixtures, root, { recursive: true });
});

test("flips the past-dated and the today-dated drafts, and lists them", () => {
  const out = run();
  assert.deepEqual(out.split("\n").filter(Boolean), DUE);
  assert.match(read(files.past).toString(), /^draft: false\r?$/m);
  assert.match(read(files.today).toString(), /^draft: false\r?$/m);
});

test("a future draft stays a draft", () => {
  run();
  assert.deepEqual(read(files.future), original(files.future));
});

test("a live page, with draft: false or with no draft line, is untouched", () => {
  run();
  assert.deepEqual(read(files.live), original(files.live));
  assert.deepEqual(read(files.noFlag), original(files.noFlag));
});

test("the only change in a flipped file is that one line (compared byte for byte)", () => {
  run();
  for (const key of ["past", "today", "crlf"]) {
    const before = original(files[key]);
    const after = read(files[key]);
    assert.notDeepEqual(after, before, key);
    assert.deepEqual(after, flipped(files[key]), key);
    assert.equal(after.length, before.length + 1, key); // "true" -> "false"
  }
  // the body's own "draft: true" line and the accent survive
  assert.match(read(files.past).toString(), /^draft: true$/m);
  assert.match(read(files.past).toString(), /café/);
});

test("--dry-run lists the due pages and changes nothing", () => {
  const out = run("--dry-run");
  assert.deepEqual(out.split("\n").filter(Boolean), DUE);
  for (const rel of Object.values(files)) assert.deepEqual(read(rel), original(rel), rel);
});

test("a second run finds nothing due (exit 0, no output)", () => {
  run();
  assert.equal(run(), "");
});

test("a caught error (a bad option) exits 2, never 1 or 3", () => {
  assert.throws(() => run("--bogus"), (e) => e.status === 2 && /unknown option/.test(e.stderr));
});

test("with an earlier --today only the earlier drafts are due", () => {
  const out = execFileSync("node", [script, "--root", root, "--today", "2026-11-01", "--dry-run"], { encoding: "utf8" });
  assert.deepEqual(out.split("\n").filter(Boolean), ["papyrus/past-draft"]);
});

test("an empty root exits 0 with no output", () => {
  const empty = mkdtempSync(join(tmpdir(), "publish-due-empty-"));
  assert.equal(execFileSync("node", [script, "--root", empty, "--today", TODAY], { encoding: "utf8" }), "");
});

// ---- front matter that is hard to read: scripts/fixtures/publish-edge (papyrus/ = all readable and due or not due, notes/ = unreadable)
const edge = join(here, "fixtures", "publish-edge");
const edgeOriginal = (rel) => readFileSync(join(edge, rel), "latin1");
/** a copy of the edge fixtures with only the named folders ("papyrus", "notes") */
function edgeRoot(...dirs) {
  const r = mkdtempSync(join(tmpdir(), "publish-due-edge-"));
  for (const d of dirs) cpSync(join(edge, "src/content", d), join(r, "src/content", d), { recursive: true });
  return r;
}
const runIn = (r, ...args) => execFileSync("node", [script, "--root", r, "--today", TODAY, ...args], { encoding: "utf8" });
const readIn = (r, rel) => readFileSync(join(r, rel), "latin1");

test("draft: True and draft: TRUE (what Astro's YAML takes as true) flip to false; a trailing comment stays", () => {
  const r = edgeRoot("papyrus");
  runIn(r);
  const cap = "src/content/papyrus/capital-true.md";
  assert.equal(readIn(r, cap), edgeOriginal(cap).replace("draft: True", "draft: false"));
  const up = "src/content/papyrus/upper-true-comment.md";
  assert.equal(readIn(r, up), edgeOriginal(up).replace("draft: TRUE   #", "draft: false   #"));
});

test("a published timestamp counts by its UTC day: 23:00Z today is due, +05:00 past midnight is still today in UTC, -05:00 late evening is tomorrow", () => {
  const r = edgeRoot("papyrus");
  const out = runIn(r).split("\n").filter(Boolean);
  assert.ok(out.includes("papyrus/timestamp-due"));
  assert.ok(out.includes("papyrus/timestamp-offset-due"));
  assert.ok(!out.includes("papyrus/timestamp-offset-future"));
  const future = "src/content/papyrus/timestamp-offset-future.md";
  assert.equal(readIn(r, future), edgeOriginal(future));
  const due = "src/content/papyrus/timestamp-due.md";
  assert.equal(readIn(r, due), edgeOriginal(due).replace("draft: true", "draft: false"));
});

test("a UTF-8 byte-order mark at the start of the file doesn't hide the draft, and is kept", () => {
  const r = edgeRoot("papyrus");
  assert.ok(runIn(r).split("\n").includes("papyrus/bom"));
  const bom = "src/content/papyrus/bom.md";
  const after = readIn(r, bom);
  assert.ok(after.startsWith("ï»¿---"));
  assert.equal(after, edgeOriginal(bom).replace("draft: true", "draft: false"));
});

test("draft: after an indented block is found, and an indented draft: inside another key's block is left alone", () => {
  const r = edgeRoot("papyrus");
  assert.ok(runIn(r).split("\n").includes("papyrus/after-block"));
  const f = "src/content/papyrus/after-block.md";
  const after = readIn(r, f);
  assert.equal(after, edgeOriginal(f).replace("\ndraft: true\nauthor", "\ndraft: false\nauthor"));
  assert.match(after, /^ {2}draft: true$/m);
});

const EDGE_DUE = ["after-block", "bom", "capital-true", "timestamp-due", "timestamp-offset-due", "upper-true-comment"].map((s) => `papyrus/${s}`);

test("the readable edge drafts are listed as collection/slug, in file order", () => {
  const r = edgeRoot("papyrus");
  assert.deepEqual(runIn(r, "--dry-run").split("\n").filter(Boolean), EDGE_DUE);
});

test("unreadable draft or published lines: exit 3 naming each file, the files stay as they are, the readable ones are still flipped", () => {
  const r = edgeRoot("papyrus", "notes");
  let err;
  try { runIn(r); } catch (e) { err = e; }
  assert.ok(err, "expected a non-zero exit");
  assert.equal(err.status, 3); // not 1: Node itself exits 1 when the script fails to load, and the workflow must tell the two apart
  // stdout still lists the pages that were flipped
  assert.deepEqual(err.stdout.split("\n").filter(Boolean), EDGE_DUE);
  assert.match(readIn(r, "src/content/papyrus/capital-true.md"), /^draft: false$/m);
  for (const name of ["draft-yes", "draft-quoted", "published-unreadable", "published-missing"]) {
    const rel = `src/content/notes/${name}.md`;
    assert.ok(err.stderr.includes(rel), `stderr names ${rel}`);
    assert.equal(readIn(r, rel), edgeOriginal(rel), `${name} untouched`);
  }
  assert.match(err.stderr, /draft: yes.*draft must be true or false/);
  assert.match(err.stderr, /published: next Tuesday.*published must be a date/);
  assert.match(err.stderr, /no `published:` line/);
});

test("--dry-run with an unreadable file also exits 3 and changes nothing", () => {
  const r = edgeRoot("papyrus", "notes");
  assert.throws(() => runIn(r, "--dry-run"), (e) => e.status === 3);
  assert.equal(readIn(r, "src/content/papyrus/capital-true.md"), edgeOriginal("src/content/papyrus/capital-true.md"));
});

// ---- collections: every folder directly under src/content, none named in the script (n-uf.com's port)
const duePage = "---\ntitle: \"A page\"\npublished: 2026-11-01\nupdated: 2026-11-01\ndraft: true\n---\n\nBody.\n";
const writePage = (r, rel, text = duePage) => { mkdirSync(dirname(join(r, rel)), { recursive: true }); writeFileSync(join(r, rel), text); };

test("a new collection folder is picked up with no change to the script", () => {
  writePage(root, "src/content/guides/new-guide.md");
  assert.deepEqual(run("--dry-run").split("\n").filter(Boolean), ["guides/new-guide", ...DUE]);
});

test("only pages directly in a collection count: not a nested folder, a .md at the content root, a symlink or a non-.md file", () => {
  const r = mkdtempSync(join(tmpdir(), "publish-due-shape-"));
  writePage(r, "src/content/papyrus/sub/nested.md");
  writePage(r, "src/content/loose.md");
  writePage(r, "src/content/papyrus/page.mdx");
  writePage(r, "outside/target.md");
  mkdirSync(join(r, "src/content/linked"), { recursive: true });
  symlinkSync(join(r, "outside/target.md"), join(r, "src/content/linked/link.md")); // a symlinked page
  symlinkSync(join(r, "outside"), join(r, "src/content/linked-dir")); // a symlinked collection
  assert.equal(runIn(r), "");
  for (const rel of ["src/content/papyrus/sub/nested.md", "src/content/loose.md", "src/content/papyrus/page.mdx", "outside/target.md"]) {
    assert.equal(readIn(r, rel), duePage, rel);
  }
});

test("a due draft whose folder or file name the guard would refuse is not flipped: exit 3, named, the rest still flipped", () => {
  const r = mkdtempSync(join(tmpdir(), "publish-due-names-"));
  writePage(r, "src/content/papyrus/good-one.md");
  writePage(r, "src/content/papyrus/Bad Name.md");
  writePage(r, "src/content/Odd_Collection/page.md");
  writePage(r, "src/content/papyrus/not.due.md", duePage.replace(/2026-11-01/g, "2026-12-31")); // not due: no error
  let err;
  try { runIn(r); } catch (e) { err = e; }
  assert.ok(err, "expected a non-zero exit");
  assert.equal(err.status, 3);
  assert.deepEqual(err.stdout.split("\n").filter(Boolean), ["papyrus/good-one"]);
  assert.match(err.stderr, /src\/content\/papyrus\/Bad Name\.md: a due draft whose folder or file name/);
  assert.match(err.stderr, /src\/content\/Odd_Collection\/page\.md: a due draft whose folder or file name/);
  assert.doesNotMatch(err.stderr, /not\.due/);
  assert.equal(readIn(r, "src/content/papyrus/Bad Name.md"), duePage);
  assert.match(readIn(r, "src/content/papyrus/good-one.md"), /^draft: false$/m);
});
