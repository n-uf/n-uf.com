// Tests for src/data/links.ts, the one definition of an external link. Run: node --test scripts/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { externalAttrs, isExternal, newTabNote } from "../src/data/links.ts";

test("an http(s) link to another host is external", () => {
  for (const href of ["https://github.com/n-uf/papyrus", "http://example.org/a", "https://doodl.n-uf.com", "https://www.n-uf.com/x", "//example.org/x"]) {
    assert.equal(isExternal(href), true, href);
  }
});

test("links to n-uf.com itself, relative links and anchors are not external", () => {
  for (const href of ["/papyrus", "/papyrus/x?y=1#z", "https://n-uf.com/papyrus", "http://n-uf.com", "#section", "papyrus", "?view=web"]) {
    assert.equal(isExternal(href), false, href);
  }
});

test("mailto:, tel: and other links that open no page stay plain", () => {
  for (const href of ["mailto:hello@example.org", "tel:+15555550100", "sms:+15555550100", "javascript:void(0)", "data:text/plain,hi"]) {
    assert.equal(isExternal(href), false, href);
    assert.deepEqual(externalAttrs(href), {}, href);
  }
});

test("an external link gets target and rel noopener (no noreferrer), a plain one nothing", () => {
  assert.deepEqual(externalAttrs("https://github.com/n-uf"), { target: "_blank", rel: "noopener" });
  assert.deepEqual(externalAttrs("/papyrus"), {});
  assert.equal(newTabNote, " (opens in a new tab)");
});
