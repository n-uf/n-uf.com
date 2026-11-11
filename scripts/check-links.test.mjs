// Tests for scripts/check-links.mjs on small dist folders built by the test (run: node --test scripts/*.test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const script = join(dirname(fileURLToPath(import.meta.url)), "check-links.mjs");

/** a dist with / and /a built, plus a page /links whose body is `anchors` */
function dist(anchors) {
  const d = mkdtempSync(join(tmpdir(), "check-links-"));
  const page = (path, body) => {
    mkdirSync(join(d, path), { recursive: true });
    writeFileSync(join(d, path, "index.html"), `<!doctype html><body>${body}</body>`);
  };
  page("", "");
  page("a", "");
  page("links", anchors);
  return d;
}
const check = (d) => spawnSync("node", [script, d], { encoding: "utf8" });
const a = (href) => `<a href="${href}">x</a>`;

test("absolute links to this site's own host that resolve pass, and count as internal", () => {
  const r = check(dist([
    "https://n-uf.com/", "https://n-uf.com/a", "https://n-uf.com/a/", "https://n-uf.com/a#top",
    "https://n-uf.com", "https://n-uf.com?x=1", "http://n-uf.com/a", "//n-uf.com/a",
  ].map(a).join("")));
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /ok \(3 pages, \d+ internal links\)/);
});

test("an absolute link to this site's own host with no built page fails, naming the page and the link", () => {
  const r = check(dist(a("https://n-uf.com/papyrus/draft-page")));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /\/links\/ -> \/papyrus\/draft-page/);
});

test("links to other hosts are ignored, including the project subdomains and look-alike hosts", () => {
  const r = check(dist([
    "https://example.com/nope/", "https://n-uf.com.evil.example/nope/", "https://notn-uf.com/nope/",
    "https://doodl.n-uf.com/nope/", "//example.com/nope/", "mailto:a@b.c",
  ].map(a).join("")));
  assert.equal(r.status, 0, r.stderr);
});

test("relative-to-root links still work: a built one passes, a missing one fails", () => {
  assert.equal(check(dist(a("/a") + a("/a/"))).status, 0);
  const r = check(dist(a("/missing")));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /\/links\/ -> \/missing/);
});

test("a link that climbs out of the build folder is refused, even to a file that exists", () => {
  const parent = mkdtempSync(join(tmpdir(), "check-links-out-"));
  writeFileSync(join(parent, "secret.txt"), "x");
  const d = join(parent, "dist");
  mkdirSync(join(d, "links"), { recursive: true });
  writeFileSync(join(d, "index.html"), "<!doctype html><body></body>");
  for (const href of ["/..%2Fsecret.txt", "/a/..%2F..%2Fsecret.txt", "/%2e%2e/secret.txt", "/../secret.txt"]) {
    writeFileSync(join(d, "links", "index.html"), `<!doctype html><body>${a(href)}</body>`);
    const r = check(d);
    assert.equal(r.status, 1, `${href} passed`);
  }
  writeFileSync(join(d, "links", "index.html"), `<!doctype html><body>${a("/..%2Fsecret.txt")}</body>`);
  assert.match(check(d).stderr, /resolves outside the build folder/);
});

test("the host comes from siteUrl in src/data/projects.ts, and --host overrides it", () => {
  const link = a("https://example.org/a");
  assert.equal(check(dist(a("https://n-uf.com/nope"))).status, 1);
  const r = spawnSync("node", [script, dist(link), "--host", "example.org"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  const bad = spawnSync("node", [script, dist(a("https://example.org/nope")), "--host", "example.org"], { encoding: "utf8" });
  assert.equal(bad.status, 1);
});
