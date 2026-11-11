// Runs the push job's own two steps from .github/workflows/publish.yml ("Check, apply and commit the patch" and
// "Push to main", their `run:` blocks taken from the file as they are) against a local bare repo standing in for
// GitHub's main (run: pnpm test). Offline and fast: the only change to the step is the ssh wrapper. `remote=` points
// at the bare repo, and `with_key` is redefined to log the git command and, before a push, let the test move main
// first, as another merge landing during the run would. The key file handling is covered by publish-workflow.test.mjs.
//
// Covered: main unmoved (pushed on try 1), main moved (rebased, re-checked, pushed on try 2), a page's `published`
// moved into the future meanwhile (re-check refuses, nothing pushed), a rebase conflict (nothing pushed), main moving
// before every push (3 rejections, nothing pushed), and a refusal that isn't "main moved" (no retry).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync, execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, chmodSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const workflow = readFileSync(join(here, "..", ".github", "workflows", "publish.yml"), "utf8").split("\n");
const REMOTE_LINE = "remote=git@github.com:n-uf/n-uf.com.git";

/** The `run: |` block of a step of the push job, de-indented. */
function stepScript(name) {
  const jobAt = workflow.indexOf("  push:");
  const at = workflow.findIndex((l, k) => k > jobAt && l === `      - name: ${name}`);
  assert.ok(jobAt > 0 && at > jobAt, `push job step "${name}"`);
  let k = workflow.findIndex((l, j) => j > at && l === "        run: |");
  const out = [];
  for (k++; k < workflow.length && (workflow[k] === "" || workflow[k].startsWith("          ")); k++) out.push(workflow[k].slice(10));
  return out.join("\n") + "\n";
}
const APPLY = stepScript("Check, apply and commit the patch");
const PUSH = stepScript("Push to main");

const PAGE = "---\ntitle: \"Page x\"\npublished: 2026-11-01\nupdated: 2026-11-01\ndraft: true\n---\n\nBody of x.\n";
const git = (cwd, ...a) => execFileSync("git", ["-c", "core.hooksPath=/dev/null", "-c", "user.name=t", "-c", "user.email=t@t", "-c", "init.defaultBranch=main", ...a], { cwd, encoding: "utf8" });

/**
 * A run of the push job: a bare "origin" whose main is the base commit, the job's checkout of it (github.sha = base),
 * the build job's handoff (the flip of x as git diff, and its page list), and the push step with the stubbed wrapper.
 * `moves` is a list of edits; before each push one is taken and committed to main from another clone.
 */
function setup(moves = []) {
  const d = mkdtempSync(join(tmpdir(), "publish-push-"));
  const seed = join(d, "seed");
  mkdirSync(join(seed, "scripts"), { recursive: true });
  mkdirSync(join(seed, "src/content/papyrus"), { recursive: true });
  copyFileSync(join(here, "check-publish-patch.py"), join(seed, "scripts/check-publish-patch.py"));
  writeFileSync(join(seed, "src/content/papyrus/x.md"), PAGE);
  writeFileSync(join(seed, "README.md"), "readme\n");
  git(seed, "init", "-q");
  git(seed, "add", "-A");
  git(seed, "commit", "-qm", "base");
  const base = git(seed, "rev-parse", "HEAD").trim();
  // the build job's handoff
  writeFileSync(join(seed, "src/content/papyrus/x.md"), PAGE.replace("draft: true", "draft: false"));
  const runner = join(d, "runner");
  mkdirSync(join(runner, "handoff"), { recursive: true });
  writeFileSync(join(runner, "handoff/publish.patch"), git(seed, "diff", "--no-color", "--no-ext-diff", "--no-renames", "--src-prefix=a/", "--dst-prefix=b/"));
  writeFileSync(join(runner, "handoff/pages.txt"), "papyrus/x\n");
  git(seed, "checkout", "-q", "--", ".");
  // origin and the job's checkout
  const origin = join(d, "origin.git");
  git(d, "clone", "-q", "--bare", seed, origin);
  const ws = join(d, "ws");
  git(d, "clone", "-q", origin, ws);
  git(ws, "checkout", "-q", "--detach", base);
  git(ws, "config", "core.hooksPath", "/dev/null");
  // what lands on main before each push
  writeFileSync(join(d, "moves.json"), JSON.stringify(moves));
  const mover = join(d, "move-main.sh");
  writeFileSync(mover, `#!/usr/bin/env bash
set -euo pipefail
n=$(cat "${d}/moved" 2>/dev/null || echo 0)
edit=$(node -e 'const m = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); process.stdout.write(m[+process.argv[2]] ?? "")' "${d}/moves.json" "$n")
[ -n "$edit" ] || exit 0
echo $((n + 1)) > "${d}/moved"
other="${d}/other-$n"
git clone -q "${origin}" "$other"
(cd "$other" && python3 -c "$edit" && git -c core.hooksPath=/dev/null -c user.name=o -c user.email=o@o commit -qam "main moved $n" && git -c core.hooksPath=/dev/null push -q origin HEAD:main)
`);
  chmodSync(mover, 0o755);
  // the push step, with the wrapper stubbed right after `remote=` (later definitions win in bash)
  assert.equal(PUSH.split(REMOTE_LINE + "\n").length, 2, "one remote= line in the push step");
  const stub = `remote=${origin}
with_key() { printf '%s\\n' "$*" >> "${d}/wrapper.log"; if [ "$1 $2" = "g push" ]; then "${mover}"; fi; "$@"; }
`;
  writeFileSync(join(d, "push.sh"), PUSH.replace(REMOTE_LINE + "\n", stub));
  writeFileSync(join(d, "apply.sh"), APPLY);
  return { d, origin, ws, runner, base };
}

const runStep = (s, script) =>
  spawnSync("bash", ["--noprofile", "--norc", "-eo", "pipefail", join(s.d, script)], {
    cwd: s.ws, encoding: "utf8", env: { ...process.env, RUNNER_TEMP: s.runner, GITHUB_WORKSPACE: s.ws, KEY: "not-a-key" },
  });
const mainLog = (s) => git(s.origin, "log", "--format=%s", "main").trim().split("\n");
const wrapperLog = (s) => (existsSync(join(s.d, "wrapper.log")) ? readFileSync(join(s.d, "wrapper.log"), "utf8").trim().split("\n") : []);
/** apply, then push; returns the push step's result */
function run(moves) {
  const s = setup(moves);
  const a = runStep(s, "apply.sh");
  assert.equal(a.status, 0, a.stdout + a.stderr);
  return { s, r: runStep(s, "push.sh") };
}

const README_EDIT = 'open("README.md", "a").write("more\\n")';
const HOLD_EDIT = 'p = "src/content/papyrus/x.md"; t = open(p).read(); open(p, "w").write(t.replace("published: 2026-11-01", "published: 2099-12-31"))';
const CONFLICT_EDIT = 'p = "src/content/papyrus/x.md"; t = open(p).read(); open(p, "w").write(t.replace("draft: true", "draft: true # held"))';

test("main not moved: pushed on try 1, one commit, the guard's message, only the draft line", () => {
  const { s, r } = run([]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /Pushed on try 1: publish: papyrus\/x/);
  assert.deepEqual(mainLog(s), ["publish: papyrus/x", "base"]);
  assert.equal(git(s.origin, "log", "-1", "--format=%an", "main").trim(), "github-actions[bot]");
  assert.match(git(s.origin, "show", "--format=", "main"), /^-draft: true\n\+draft: false$/m);
  assert.deepEqual(wrapperLog(s).map((l) => l.split(" ").slice(0, 2).join(" ")), ["g push"]);
});

test("main moved once: fetched over the wrapper, rebased, re-checked and pushed on try 2", () => {
  const { s, r } = run([README_EDIT]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stderr, /fetch first|non-fast-forward/);
  assert.match(r.stdout, /Pushed on try 2: publish: papyrus\/x/);
  assert.deepEqual(mainLog(s), ["publish: papyrus/x", "main moved 0", "base"]);
  assert.deepEqual(wrapperLog(s).map((l) => l.split(" ").slice(0, 2).join(" ")), ["g push", "g fetch", "g push"]);
});

test("a page's `published` moved into the future meanwhile: the re-check refuses, nothing is pushed", () => {
  const { s, r } = run([HOLD_EDIT]);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /isn't due: published 2099-12-31/);
  assert.match(r.stdout, /the flip no longer passes the patch check on the new main/);
  assert.deepEqual(mainLog(s), ["main moved 0", "base"]);
});

test("a rebase conflict (main changed the draft line itself): nothing is pushed", () => {
  const { s, r } = run([CONFLICT_EDIT]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /rebase onto the new main conflicted; nothing was pushed/);
  assert.deepEqual(mainLog(s), ["main moved 0", "base"]);
});

test("main moves before every push: 3 rejections, then the step fails with nothing pushed", () => {
  const { s, r } = run([README_EDIT, README_EDIT, README_EDIT, README_EDIT]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /push to main was rejected 3 times/);
  assert.equal(wrapperLog(s).filter((l) => l.startsWith("g push")).length, 3);
  assert.ok(!mainLog(s).includes("publish: papyrus/x"));
});

test("a refusal that is not 'main moved' (a rule, the key) fails at once, with no rebase", () => {
  const s = setup([]);
  assert.equal(runStep(s, "apply.sh").status, 0);
  const hook = join(s.origin, "hooks", "pre-receive");
  writeFileSync(hook, "#!/bin/sh\necho 'refused by a rule' >&2\nexit 1\n");
  chmodSync(hook, 0o755);
  const r = runStep(s, "push.sh");
  assert.equal(r.status, 1);
  assert.match(r.stdout, /refused \(not because main moved\)/);
  assert.deepEqual(wrapperLog(s).map((l) => l.split(" ").slice(0, 2).join(" ")), ["g push"]);
  assert.deepEqual(mainLog(s), ["base"]);
});
