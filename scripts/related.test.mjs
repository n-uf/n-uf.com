// Tests for src/data/related.mjs: an article's `related` list on go-live days. Run: node --test scripts/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { hasAlwaysLiveEntry, resolveRelated } from "../src/data/related.mjs";

const card = (title) => ({ title, description: `${title} description` });
const fixed = new Map([["/papyrus", card("papyrus")], ["/", card("n-uf")]]);
const articles = new Map([
  ["/papyrus/live-one", { ...card("Live one"), live: true }],
  ["/papyrus/later-one", { ...card("Later one"), live: false }],   // a draft
]);
const resolve = (paths, showDrafts = false) => resolveRelated(paths, { fixed, articles, showDrafts });

test("in production an entry that points at a draft is skipped, silently", () => {
  assert.deepEqual(resolve(["/papyrus", "/papyrus/later-one", "/papyrus/live-one"]).map((c) => c.path), ["/papyrus", "/papyrus/live-one"]);
  assert.deepEqual(resolve(["/papyrus", "/papyrus/later-one"]).map((c) => c.path), ["/papyrus"]);
});

test("a preview shows the draft's card, and the day it goes live it appears in production too", () => {
  assert.deepEqual(resolve(["/papyrus", "/papyrus/later-one"], true).map((c) => c.path), ["/papyrus", "/papyrus/later-one"]);
  const flipped = new Map(articles).set("/papyrus/later-one", { ...card("Later one"), live: true });
  const cards = resolveRelated(["/papyrus", "/papyrus/later-one"], { fixed, articles: flipped, showDrafts: false });
  assert.deepEqual(cards.map((c) => c.title), ["papyrus", "Later one"]);
});

test("a path that exists nowhere fails the build, draft or not, in production or a preview", () => {
  assert.throws(() => resolve(["/papyrus", "/papyrus/typo-one"]), /"\/papyrus\/typo-one" points to no page/);
  assert.throws(() => resolve(["/papyrus", "/papyrus/typo-one"], true), /points to no page/);
  assert.throws(() => resolve(["/nope"]), /points to no page/);
});

test("the cards carry the title and description of the page", () => {
  assert.deepEqual(resolve(["/papyrus/live-one"])[0], { path: "/papyrus/live-one", title: "Live one", description: "Live one description" });
});

test("the list needs at least one entry that is always live, /papyrus counting", () => {
  const always = new Set(["/", "/papyrus", "/claude-machine-transfer"]);
  assert.equal(hasAlwaysLiveEntry(["/papyrus/a", "/papyrus"], always), true);
  assert.equal(hasAlwaysLiveEntry(["/papyrus/a", "/papyrus/b"], always), false);
  assert.equal(hasAlwaysLiveEntry(["/papyrus/a", "/claude-machine-transfer"], always), true);
});
