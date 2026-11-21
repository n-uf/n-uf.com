// Tests for the npm packages in src/data/projects.ts: only published @n-uf packages, the main package first, each one
// listed once, and the URL in the form the project sites use. Run: node --test scripts/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { npmUrl, projects } from "../src/data/projects.ts";

const published = {
  "hypr-tiling": ["@n-uf/hypr-tiling"],
  motion: ["@n-uf/motion", "@n-uf/placement", "@n-uf/docking"],
  doodl: ["@n-uf/doodl"],
  debugsy: ["@n-uf/debugsy"],
  papyrus: ["@n-uf/papyrus", "@n-uf/papyrus-react"],
};

test("npm is a list of packages on exactly the projects that publish to npmjs.com", () => {
  const withNpm = Object.fromEntries(
    projects.filter((project) => project.npm !== undefined).map((project) => [project.id, project.npm]),
  );
  assert.deepEqual(withNpm, published);
});

test("each package is a scoped @n-uf name, listed once across the projects", () => {
  const all = projects.flatMap((project) => project.npm ?? []);
  for (const name of all) {
    assert.match(name, /^@n-uf\/[a-z][a-z-]*$/);
  }
  assert.equal(new Set(all).size, all.length);
});

test("npmUrl gives the npmjs.com package page", () => {
  assert.equal(npmUrl("@n-uf/motion"), "https://www.npmjs.com/package/@n-uf/motion");
});
