// Tests for src/data/inline-code.mjs. Run: node --test scripts/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { inlineCodeHtml, plainText } from "../src/data/inline-code.mjs";

test("a backtick span becomes <code>, the text around it is kept", () => {
  assert.equal(inlineCodeHtml("`@page { size: A4; margin: 0 }` sets the paper"),
    "<code>@page { size: A4; margin: 0 }</code> sets the paper");
  assert.equal(inlineCodeHtml("Use `size` and `margin` together."), "Use <code>size</code> and <code>margin</code> together.");
});

test("HTML is escaped first, inside and outside a span", () => {
  assert.equal(inlineCodeHtml("a <b>bold</b> & `<div class=\"x\">` 'q'"),
    "a &lt;b&gt;bold&lt;/b&gt; &amp; <code>&lt;div class=&quot;x&quot;&gt;</code> &#39;q&#39;");
  assert.equal(inlineCodeHtml("`</code><script>alert(1)</script>`"), "<code>&lt;/code&gt;&lt;script&gt;alert(1)&lt;/script&gt;</code>");
});

test("only backtick spans: other markdown stays as written", () => {
  assert.equal(inlineCodeHtml("**bold** and _em_ and [a link](https://x.y)"), "**bold** and _em_ and [a link](https://x.y)");
});

test("a lone backtick, an empty span and a span across a line break are left as text", () => {
  assert.equal(inlineCodeHtml("it`s"), "it`s");
  assert.equal(inlineCodeHtml("a `` b"), "a `` b");
  assert.equal(inlineCodeHtml("`one\ntwo`"), "`one\ntwo`");
});

test("plainText drops the backticks and nothing else", () => {
  assert.equal(plainText("`@page { size: A4; }` sets <the> paper & `size`"), "@page { size: A4; } sets <the> paper & size");
  assert.equal(plainText("it`s"), "its");
});
