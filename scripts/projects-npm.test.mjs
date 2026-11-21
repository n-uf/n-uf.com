// Tests for the npm packages in src/data/projects.ts: only published @n-uf packages, the main package first, each one
// listed once, and the URL in the form the project sites use. Run: node --test scripts/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { listedProjects, npmUrl, projects, studioId } from "../src/data/projects.ts";
import { projectItemList } from "../src/data/schema.ts";

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

const list = projectItemList(listedProjects());
const itemOf = (name) => list.itemListElement.find((entry) => entry.item.name === name).item;

test("the ItemList holds each project as a SoftwareSourceCode item; the ListItem wrapper has only position and item", () => {
  assert.equal(list["@type"], "ItemList");
  assert.equal(list.itemListElement.length, listedProjects().length);
  list.itemListElement.forEach((entry, index) => {
    assert.deepEqual(Object.keys(entry).sort(), ["@type", "item", "position"]);
    assert.equal(entry["@type"], "ListItem");
    assert.equal(entry.position, index + 1);
    assert.equal(entry.item["@type"], "SoftwareSourceCode");
    assert.deepEqual(entry.item.author, { "@id": studioId });
    assert.equal(entry.sameAs, undefined, "no sameAs on the wrapper");
  });
});

test("sameAs holds only the main npm package; the other packages are parts", () => {
  assert.deepEqual(itemOf("motion").sameAs, ["https://www.npmjs.com/package/@n-uf/motion"]);
  assert.deepEqual(
    itemOf("motion").hasPart.map((part) => [part.name, part.url]),
    [
      ["@n-uf/placement", "https://www.npmjs.com/package/@n-uf/placement"],
      ["@n-uf/docking", "https://www.npmjs.com/package/@n-uf/docking"],
    ],
  );
  assert.deepEqual(itemOf("papyrus").sameAs, ["https://www.npmjs.com/package/@n-uf/papyrus"]);
  assert.deepEqual(itemOf("papyrus").hasPart.map((part) => part.name), ["@n-uf/papyrus-react"]);
  for (const name of ["hypr-tiling", "DOODL", "debugsy"]) {
    assert.equal(itemOf(name).sameAs.length, 1);
    assert.equal(itemOf(name).hasPart, undefined, `${name} has one package`);
  }
});

test("projects with nothing on npm have no sameAs and no hasPart", () => {
  for (const name of ["cl_audit", "cl_quick", "harbuz", "kavun", "dynia", "machine-transfer"]) {
    const item = itemOf(name);
    assert.equal(item.sameAs, undefined, `${name}: sameAs`);
    assert.equal(item.hasPart, undefined, `${name}: hasPart`);
  }
  assert.equal(itemOf("harbuz").codeRepository, undefined, "harbuz has no public repository");
});

test("npmUrl gives the npmjs.com package page", () => {
  assert.equal(npmUrl("@n-uf/motion"), "https://www.npmjs.com/package/@n-uf/motion");
});
