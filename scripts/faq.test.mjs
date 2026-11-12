// Tests for src/data/faq.ts: the format a search result can lift (a question, then one answer paragraph of 40 to 60
// words whose first sentence is the direct answer, with no link in it), and the home answers against the project data
// in src/data/projects.ts. Run: node --test scripts/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { answerMarkdown, answerText, homeFaq, machineTransferFaq, plainFaq } from "../src/data/faq.ts";
import { listedProjects } from "../src/data/projects.ts";

const wordCount = (text) => text.trim().split(/\s+/).length;
const links = (item) => item.a.filter((part) => typeof part !== "string");
const names = (list) => list.map((project) => project.name);
const joined = (list) => (list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")} and ${list.at(-1)}`);

const listed = listedProjects();
const polyform = listed.filter((project) => project.description.includes("Licence: PolyForm Perimeter 1.0.1"));
const mit = listed.filter((project) => /\bMIT\b/.test(project.description));
const unlicensed = listed.filter((project) => !polyform.includes(project) && !mit.includes(project));
const publicSource = listed.filter((project) => project.repo !== undefined);
const privateSource = listed.filter((project) => project.repo === undefined);
const answerOf = (question) => {
  const item = homeFaq.find((entry) => entry.q === question);
  assert.ok(item, `no question "${question}"`);
  return item;
};

for (const [page, items, min, max] of [
  ["home", homeFaq, 5, 6],
  ["machine-transfer", machineTransferFaq, 1, 3],
]) {
  test(`${page}: ${min} to ${max} questions, each a question, none twice`, () => {
    assert.ok(items.length >= min && items.length <= max, `${items.length} questions`);
    assert.equal(new Set(items.map((item) => item.q)).size, items.length);
    for (const item of items) assert.ok(item.q.endsWith("?"), item.q);
  });

  test(`${page}: each answer is 40 to 60 words and its first sentence has no link`, () => {
    for (const item of items) {
      const words = wordCount(answerText(item.a));
      assert.ok(words >= 40 && words <= 60, `${item.q}: ${words} words`);
      assert.equal(typeof item.a[0], "string", `${item.q}: starts with a link`);
      assert.match(item.a[0], /[.!?]\s/, `${item.q}: the first sentence runs into a link`);
      assert.ok(links(item).length < item.a.length, `${item.q}: the answer is only links`);
    }
  });

  test(`${page}: the JSON-LD text is the page text, and the Markdown has the same words`, () => {
    for (const [index, entry] of plainFaq(items).entries()) {
      assert.equal(entry.a, answerText(items[index].a));
      assert.equal(answerMarkdown(items[index].a).replace(/\[([^\]]*)\]\([^)]*\)/g, "$1"), entry.a);
    }
  });
}

test("every listed project is named and linked to its site in the tools answer", () => {
  const item = answerOf("What tools does n-uf make?");
  assert.equal(listed.length, 10, "the answers say ten projects: rewrite them");
  assert.match(answerText(item.a), /^n-uf makes ten tools/);
  // the answer groups them by kind (libraries, UI kits, apps, skill), so the order differs from the data's
  const byName = (a, b) => a[0].localeCompare(b[0]);
  assert.deepEqual(
    links(item).map((link) => [link.text, link.href]).sort(byName),
    listed.map((project) => [project.name, project.url]).sort(byName),
  );
});

test("licence answer: each group of projects, as the project entries say", () => {
  const text = answerText(answerOf("Is n-uf free?").a);
  assert.ok(polyform.length > 0 && mit.length > 0 && unlicensed.length > 0);
  assert.ok(text.includes(`${joined(names(polyform))} use PolyForm Perimeter 1.0.1`), "PolyForm group");
  assert.ok(text.includes(`${joined(names(mit))} is MIT`), "MIT group");
  assert.ok(text.includes(`${joined(names(unlicensed))} have no public source yet`), "no-licence group");
  assert.equal(publicSource.length, 7, "the answer says the seven with public source: rewrite it");
  assert.ok(text.includes("the seven with public source are free to use"));
});

test("source answer: public source and not-public source, as the project entries say", () => {
  const item = answerOf("Is n-uf open source?");
  const text = answerText(item.a);
  assert.ok(text.includes("seven of the ten"), "count");
  assert.equal(publicSource.length, 7);
  assert.equal(privateSource.length, 3);
  for (const project of privateSource) assert.match(project.description, /Source not public yet/);
  assert.ok(text.includes(`${joined(names(privateSource))} say their source is not public yet`));
  // the PolyForm projects link to their repositories; the MIT one is named in the first sentence
  assert.deepEqual(
    links(item).map((link) => [link.text, link.href]),
    polyform.map((project) => [project.name, project.repo]),
  );
  assert.ok(text.includes(`only one of them, ${mit[0].name}, is MIT-licensed`));
});

test("stability answer links the issues pages of projects with a public repository", () => {
  const item = answerOf("Is n-uf stable?");
  assert.ok(answerText(item.a).includes("seven public projects"));
  for (const link of links(item)) {
    const repo = publicSource.find((project) => link.href === `${project.repo}/issues`);
    assert.ok(repo, link.href);
    assert.equal(link.text, link.href.replace("https://", ""));
  }
});
