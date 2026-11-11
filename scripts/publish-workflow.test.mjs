// Structure checks on .github/workflows/publish.yml (text based; run: pnpm test). They guard what a reviewer relied
// on: the order of the build job's steps, where the deploy key may appear (only in the steps that use it, only in jobs
// with the `publish` environment), both checkouts at github.sha without credentials, the push and verify-key jobs
// taking the same key check and ssh command, no node where the key is, an explicit push refspec with no --force, the
// guards that keep verify-key runs and schedule runs apart, and every action pinned to a full SHA.
// Ported from n-uf/cl_audit_home (scripts/publish-workflow.test.mjs), whose push job hands the key to checkout instead.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = "n-uf/n-uf.com";
const HOST_KEY = "github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl";

const text = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", ".github", "workflows", "publish.yml"), "utf8");
const code = (s) => s.replace(/^ *#.*$/gm, ""); // without comment lines
const jobsAt = text.indexOf("\njobs:\n");
const jobBlocks = {};
{
  const re = /^  ([a-z][a-z-]*):\n/gm; // a job key, two spaces in
  const found = [];
  re.lastIndex = jobsAt;
  for (let m; (m = re.exec(text)); ) found.push({ name: m[1], at: m.index });
  found.forEach((f, i) => { jobBlocks[f.name] = text.slice(f.at, i + 1 < found.length ? found[i + 1].at : text.length); });
}
/** the steps of a job, each as its text from `- ` to the next step */
const steps = (job) => jobBlocks[job].split(/\n(?= {6}- )/).slice(1);
const step = (job, name) => {
  const s = steps(job).find((t) => t.startsWith(`      - name: ${name}\n`));
  assert.ok(s, `${job}: step "${name}"`);
  return s;
};
const stepAt = (job, name) => { const i = jobBlocks[job].indexOf(`- name: ${name}\n`); assert.notEqual(i, -1, `${job}: step "${name}"`); return i; };
/** the `with:` lines of every actions/checkout step of a job */
const checkouts = (job) => steps(job).filter((s) => /uses: actions\/checkout@/.test(s)).map((s) => s.slice(s.indexOf("with:")));
/** the line that sets GIT_SSH_COMMAND, and the key-file setup before it, in a step */
const sshSetup = (s) => {
  const m = s.match(/ {10}g\(\) \{[\s\S]*?\n {10}remote=[^\n]*\n/);
  assert.ok(m, "ssh setup block");
  return m[0];
};

test("the jobs are build, push, verify-key and report", () => {
  assert.deepEqual(Object.keys(jobBlocks), ["build", "push", "verify-key", "report"]);
});

test("build uploads the patch and page list before pnpm runs, and sets `ready` only after the build", () => {
  const flip = stepAt("build", "Flip due drafts");
  const upload = stepAt("build", "Hand over the flip (patch and page list)");
  const pnpm = stepAt("build", "Install pnpm");
  const build = stepAt("build", "Build the site");
  const ready = stepAt("build", "Ready to push");
  assert.ok(flip < upload && upload < pnpm && pnpm < build && build < ready, "flip, upload, pnpm, build, ready");
  assert.ok(jobBlocks.build.indexOf("pnpm install --frozen-lockfile") > upload, "pnpm install runs after the upload");
  assert.equal(jobBlocks.build.split("upload-artifact@").length - 1, 1);
  assert.doesNotMatch(code(jobBlocks.build), /cache:/, "no package cache in the publish build");
  assert.match(jobBlocks.push, /needs\.build\.outputs\.ready == 'true'/);
});

test("the deploy key appears only in the key checks, the push step and the ls-remote step, in `publish` jobs", () => {
  assert.equal(text.match(/secrets\./g).length, 4, "four uses of a secret in the whole file");
  assert.equal(text.match(/\$\{\{ secrets\.PUBLISH_DEPLOY_KEY \}\}/g).length, 4);
  for (const job of ["build", "report"]) {
    assert.doesNotMatch(jobBlocks[job], /secrets\.|environment:/, job);
  }
  for (const job of ["push", "verify-key"]) {
    assert.match(jobBlocks[job], /\n {4}environment: publish\n/, job);
    const withKey = steps(job).filter((s) => s.includes("secrets.PUBLISH_DEPLOY_KEY"));
    const names = withKey.map((s) => s.match(/- name: ([^\n]*)/)[1]);
    assert.deepEqual(names, job === "push" ? ["Check the deploy key secret", "Push to main"] : ["Check the deploy key secret", "List main over ssh"]);
    for (const s of withKey) assert.match(s, /\n {8}env:\n {10}KEY: \$\{\{ secrets\.PUBLISH_DEPLOY_KEY \}\}\n/, "the key goes into the step's env only");
  }
  assert.doesNotMatch(text, /ssh-key:/, "the key is never handed to actions/checkout");
  // no repo-level fallback: the env var is never set at job or workflow level
  assert.doesNotMatch(text, /^ {0,4}env:/m);
});

test("both checkouts are github.sha without credentials; nothing crosses from build but the artifact", () => {
  for (const job of ["build", "push"]) {
    const cs = checkouts(job);
    assert.equal(cs.length, 1, `${job}: one checkout`);
    assert.match(cs[0], /ref: \$\{\{ github\.sha \}\}\n/, job);
    assert.match(cs[0], /persist-credentials: false\n/, job);
  }
  assert.equal(checkouts("verify-key").length, 0);
  assert.doesNotMatch(jobBlocks.push, /needs\.build\.outputs\.(?!ready)/, "push reads no build output but ready");
});

test("push checks the patch with the checker before git apply, and switches hooks off first", () => {
  const s = step("push", "Check, apply and commit the patch");
  const checker = s.indexOf('python3 -I "$RUNNER_TEMP/check-publish-patch.py"');
  assert.ok(checker > 0 && checker < s.indexOf("git apply --check") && s.indexOf("git apply --check") < s.indexOf("git apply --index"));
  assert.ok(s.indexOf("cp scripts/check-publish-patch.py") < checker, "the checker copy is saved first");
  assert.ok(stepAt("push", "Switch git hooks off") < stepAt("push", "Download the flip"));
  assert.match(step("push", "Switch git hooks off"), /run: git config core\.hooksPath \/dev\/null\n/);
});

test("the push goes to the explicit ssh URL's refs/heads/main, never --force, and re-checks after a rebase", () => {
  const s = code(step("push", "Push to main"));
  assert.match(s, new RegExp(`\\n {10}remote=git@github\\.com:${REPO.replace(/[./]/g, "\\$&")}\\.git\\n`));
  assert.match(s, /with_key g push --no-follow-tags "\$remote" HEAD:refs\/heads\/main /);
  const pushLines = s.split("\n").filter((l) => / push /.test(l));
  assert.equal(pushLines.length, 1, "one push command");
  assert.doesNotMatch(pushLines[0], /--force|\s-f\b|\+HEAD|\+refs|origin|--mirror|--all\b|\s--tags\b|--delete|\s:refs|-o\s/);
  assert.doesNotMatch(s, /--force-with-lease|push\.default|remote\.origin|url\.[^ ]*insteadOf/);
  assert.match(s, /grep -q -E 'non-fast-forward\|fetch first'/);
  assert.match(s, /if ! recheck "\$upstream"; then/);
  assert.match(s, /python3 -I "\$RUNNER_TEMP\/check-publish-patch\.py" --root "\$wt"/);
  assert.match(s, /for attempt in 1 2 3; do/);
});

test("push and verify-key take the same key check and the same ssh command, with the pinned host key", () => {
  const check = (job) => step(job, "Check the deploy key secret");
  assert.equal(code(check("verify-key")).trim(), code(check("push")).trim());
  const push = sshSetup(step("push", "Push to main"));
  assert.equal(sshSetup(step("verify-key", "List main over ssh")), push);
  assert.ok(push.includes(`echo '${HOST_KEY}' > "$keydir/known_hosts"`));
  assert.match(push, /trap 'rm -rf "\$keydir"' EXIT/);
  assert.match(push, /keydir=\$\(mktemp -d "\$RUNNER_TEMP\/ssh\.XXXXXX"\)/);
  assert.match(push, /\(umask 077 && printf '%s\\n' "\$key" > "\$keydir\/key"\)\n {12}chmod 600 "\$keydir\/key"/);
  assert.match(push, /rm -f "\$keydir\/key"/);
  for (const opt of ["-F /dev/null", "-o IdentitiesOnly=yes", "-o IdentityAgent=none", "-o ProxyCommand=none", "-o BatchMode=yes", "-o StrictHostKeyChecking=yes", "-o GlobalKnownHostsFile=/dev/null", "-o UserKnownHostsFile='$keydir/known_hosts'"]) {
    assert.ok(push.includes(` ${opt}`), opt);
  }
  assert.match(push, /GIT_SSH_COMMAND="\/usr\/bin\/ssh -F \/dev\/null -i '\$keydir\/key'/);
});

test("verify-key only lists main over ssh: no checkout, push, apply, commit or artifact", () => {
  const job = code(jobBlocks["verify-key"]);
  assert.match(job, /permissions:\n {6}contents: read\n/);
  assert.match(job, /with_key g ls-remote "\$remote" refs\/heads\/main/);
  for (const forbidden of [/ push /, /git apply/, /\bg(?:it)? commit\b/, /rebase/, /artifact/, /actions\/checkout/]) {
    assert.doesNotMatch(job, forbidden);
  }
});

test("verify-key runs only for a verify-key run on main; build, push and report never do, and a schedule run has no input", () => {
  assert.match(jobBlocks["verify-key"], new RegExp(`if: github\\.repository == '${REPO.replace(/[./]/g, "\\$&")}' && github\\.ref == 'refs/heads/main' && inputs\\.verify-key\\n`));
  assert.match(jobBlocks.build, new RegExp(`if: github\\.repository == '${REPO.replace(/[./]/g, "\\$&")}' && !inputs\\.verify-key\\n`));
  assert.match(jobBlocks.push, /if: github\.repository == 'n-uf\/n-uf\.com' && github\.ref == 'refs\/heads\/main' && needs\.build\.outputs\.ready == 'true' && !inputs\.verify-key\n/);
  assert.match(jobBlocks.report, /!inputs\.verify-key/);
  assert.match(text, /on:\n {2}schedule:\n {4}- cron: '10 0 \* \* \*'\n {2}workflow_dispatch:\n {4}inputs:\n {6}verify-key:\n(?: {8}[^\n]*\n)*? {8}type: boolean\n {8}default: false\n/);
});

test("the workflow's token is read-only, runs share one queue, and every script runs under bash (pipefail)", () => {
  assert.match(text, /\npermissions:\n {2}contents: read /);
  assert.doesNotMatch(text, /: write/);
  assert.match(text, /\nconcurrency:\n {2}group: publish\n {2}cancel-in-progress: false\n/);
  assert.match(text, /\ndefaults:\n {2}run:\n {4}shell: bash\n/);
});

test("no job that holds the key runs node, npm, pnpm or npx", () => {
  for (const job of ["push", "verify-key"]) {
    assert.doesNotMatch(code(jobBlocks[job]), /setup-node|action-setup|\bnpm\b|\bpnpm\b|\bnpx\b|\bnode\b/, job);
  }
});

test("every action is pinned to a full commit SHA", () => {
  for (const file of ["publish.yml", "ci.yml"]) {
    const t = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", ".github", "workflows", file), "utf8");
    const uses = [...t.matchAll(/^\s*(?:- )?uses: (\S+)/gm)].map((m) => m[1]);
    assert.ok(uses.length >= 3, file);
    for (const u of uses) assert.match(u, /^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/, `${file}: ${u}`);
  }
});
