// Tests for src/data/front-matter.mjs: the sitemap's reading of `draft` and `updated`, which must agree with the
// publish flip (scripts/publish-due.mjs). Run: node --test scripts/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { isDraft, updatedDay } from "../src/data/front-matter.mjs";

const page = (front, body = "Body.\n") => `---\n${front}\n---\n${body}`;

test("draft: true in every spelling the flip reads", () => {
  for (const v of ["true", "True", "TRUE", "true   # scheduled by hand", "True # x"]) assert.equal(isDraft(page(`draft: ${v}`)), true, v);
  assert.equal(isDraft(page('"draft": true')), true);
  assert.equal(isDraft(page("'draft': true")), true);
});

test("not a draft: false, no line, a quoted value, an indented key, a body sample", () => {
  assert.equal(isDraft(page("draft: false")), false);
  assert.equal(isDraft(page("title: x")), false);
  assert.equal(isDraft(page('draft: "true"')), false);
  assert.equal(isDraft(page("faq:\n  draft: true")), false);
  assert.equal(isDraft(page("title: x", "draft: true\n")), false);
});

test("a byte-order mark and CRLF line ends are read", () => {
  assert.equal(isDraft("﻿" + page("draft: true").replace(/\n/g, "\r\n")), true);
  assert.equal(updatedDay(page("updated: 2026-11-10").replace(/\n/g, "\r\n")), "2026-11-10");
});

test("updated: a date, a quoted date, and a timestamp as its UTC day", () => {
  assert.equal(updatedDay(page("updated: 2026-11-10")), "2026-11-10");
  assert.equal(updatedDay(page('updated: "2026-11-10"  # last edit')), "2026-11-10");
  assert.equal(updatedDay(page("updated: 2026-11-10T23:30:00-05:00")), "2026-11-11");
  assert.equal(updatedDay(page("updated: 2026-11-10T01:00:00+03:00")), "2026-11-09");
  assert.equal(updatedDay(page("updated: 2026-11-10 08:00:00")), "2026-11-10");
  assert.equal(updatedDay(page("title: x")), null);
  assert.equal(updatedDay(page("updated: soon")), null);
});
