# Scheduled publishing on n-uf.com

A content page can merge to `main` early as a draft and go live on its date with no merge that day. This is the same
machinery as cl-audit.n-uf.com, debugsy and hypr-tiling (spec: `~/.claude/skills/n-uf-seo/scheduled-publishing.md`).

| Piece | File |
| --- | --- |
| The daily flip, build and push | `.github/workflows/publish.yml` |
| The flip itself (Node standard library only) | `scripts/publish-due.mjs` |
| The guard the push job runs before applying anything (Python standard library only) | `scripts/check-publish-patch.py` |
| CI on every PR and push to main (`test-and-build`) | `.github/workflows/ci.yml` |
| Tests for all of the above (`pnpm test`) | `scripts/*.test.mjs`, `scripts/fixtures/` |

**Ships with the content layer, never alone.** This machinery only flips a `draft:` line; hiding drafts is the site's
job. That is the content layer on the branch `fl/papyrus-articles-layer`: the collections under `src/content`
(`src/content.config.ts`) and the one draft rule, `isLive` in `src/data/articles.ts` (production hides drafts,
previews show them). Without it main has no draft handling, so a `draft: true` page would either not exist or go
live at once. Merge the two together, or the content layer first.

## How a draft goes live

1. The page merges to `main` as `src/content/<collection>/<slug>.md` (any folder directly under `src/content` is a
   collection, with no change to the scripts) with, in its front matter:
   ```yaml
   published: 2026-11-24   # the go-live day, UTC
   updated: 2026-11-24     # same as published
   draft: true
   ```
   Production builds hide drafts (the page 404s and is in no list); previews show them.
2. Every day at 00:10 UTC (GitHub often starts it hours late) the `publish` workflow runs:
   - **build** (no secret): `publish-due.mjs` sets `draft: false` on every draft whose `published` day is today or
     earlier, and changes nothing else. It hands the change over as a patch plus a page list, then installs and runs
     `pnpm build`. A red build stops the run and nothing is pushed.
   - **push** (the `publish` environment, holding the deploy key): `check-publish-patch.py` refuses the patch unless
     it is only `draft: true` -> `draft: false` lines inside the front matter of existing, due pages, exactly the
     pages listed. Then it commits `publish: <collection>/<slug>[, …]` as github-actions[bot] and pushes to `main`. If
     `main` moved meanwhile it rebases, checks again, and retries (3 pushes at most).
3. Vercel deploys that push like any other commit.

Nothing due: the run is green and nothing is committed. Rerunning on the same day is safe: the pages are no longer
drafts, so a second run finds nothing due.

Folder and file names: the collection is lowercase letters, digits and dashes, the slug letters, digits, `_` and `-`,
and the page is a `.md` file directly in the collection folder. A due draft named otherwise is not flipped and turns
the run red (exit 3 of `publish-due.mjs`), so it can't stay a draft silently.

Try it locally (changes nothing):

```sh
node scripts/publish-due.mjs --dry-run                       # what would go live today (UTC)
node scripts/publish-due.mjs --dry-run --today 2026-12-01    # ... on another day
```

## Holding or undoing a flip

- **Hold** a page before 00:10 UTC on its day: in a PR, move `published` to a later day (or set it back to
  `draft: true` with a later date; a draft whose date has passed flips on the next run). In an emergency, disable the
  workflow: Actions > publish > `...` > Disable workflow.
- **A hold or a manual flip that lands while a run is going** turns that run red and publishes nothing. Moving a
  due page's `published` into the future makes the re-check after the rebase refuse the flip; a maintainer setting
  `draft: false` by hand conflicts with the rebase. Either way the whole flip is dropped, so **the other pages due
  that day wait for the next day's run** (they are still drafts with a past date, so it flips them). If they must go
  out the same day, run the workflow again by hand: `gh workflow run publish.yml -R n-uf/n-uf.com --ref main`.
  (A hold that merges after the push is too late: undo instead.)
- **Undo** a flip that went out: revert the `publish: …` commit in a PR (`git revert <sha>`), or set `draft: true`
  again and move `published` to a future day.
- **A late flip** (a held page, a disabled schedule, a rerun on a later day): correct `published` and `updated` to the
  real flip day in a follow-up PR.
- **Schedules switch off** in a repo with no activity for 60 days: Actions > publish > Enable workflow.

## What the operator sets up once

The workflow needs three things in the GitHub repo `n-uf/n-uf.com`. None exist yet (no deploy key, no ruleset, no
`publish` environment as of 2026-11-10). They are credential and settings changes, so they are the operator's to make.
The key is never stored at repo level: a `workflow_dispatch` from another branch can read repo secrets, so a branch
copy of the workflow could take it. In the environment, limited to `main`, it can't.

Order: environment and key first, the ruleset created **disabled**, then merge this workflow, run it, and only then
switch the ruleset on.

Each `gh` block below is one script: paste it whole into a terminal (it runs in its own `bash`, whatever the login
shell). Each stops at the first error, leaves nothing on disk (Ctrl-C included), and is safe to run again: a step
that already happened is detected and skipped, or the script stops and says what to do.

### 1. The `publish` environment, limited to main

Click-path: github.com/n-uf/n-uf.com > Settings > Environments > New environment > name `publish` > Configure
environment > Deployment branches and tags: **Selected branches and tags** > Add deployment branch or tag rule >
Ref type **Branch**, name pattern `main` > Add rule. (No required reviewers, no wait timer.)

Same with `gh`:

```sh
bash <<'SH'
set -euo pipefail
repo=n-uf/n-uf.com
# creating or updating the environment is the same call (PUT): safe to repeat
echo '{"deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true}}' \
  | gh api -X PUT "repos/$repo/environments/publish" --input - > /dev/null
policies=$(gh api "repos/$repo/environments/publish/deployment-branch-policies" \
  --jq '[.branch_policies[] | "\(.type):\(.name)"] | join(",")')
case "$policies" in
  "") gh api -X POST "repos/$repo/environments/publish/deployment-branch-policies" -f name=main -f type=branch > /dev/null ;;
  "branch:main") echo "the branch policy main is already there" ;;
  *) echo "unexpected deployment policies: $policies (want only branch:main); fix them in Settings > Environments > publish" >&2; exit 1 ;;
esac
# check: one policy, the branch main
gh api "repos/$repo/environments/publish/deployment-branch-policies" --jq '.branch_policies[] | {name, type}'
SH
```

### 2. The write deploy key, its private half in the environment

It must be the repo's **only** write deploy key: the ruleset's bypass applies to every deploy key.

Click-path: make the key pair locally in a temporary folder (`ssh-keygen -q -t ed25519 -N "" -f <tmp>/key`). In
github.com/n-uf/n-uf.com > Settings > Environments > `publish` > Environment secrets > Add environment secret > Name
`PUBLISH_DEPLOY_KEY`, Value: the whole contents of the private `key` file > Add secret. **Then** Settings > Deploy keys
> Add deploy key > Title `publish-bot (scheduled publishing)`, Key: the contents of `key.pub`, tick **Allow write
access** > Add key. Delete the temporary folder. (Secret first: a failure in between leaves an unregistered key in the
environment, which is harmless, never a registered write key whose private half is lost.)

Same with `gh` (prints only the fingerprint, never key material). It refuses to run while the repo has any write
deploy key: to replace one, see "Revoke or rotate the key" below.

```sh
bash <<'SH'
set -euo pipefail
repo=n-uf/n-uf.com
title="publish-bot (scheduled publishing)"
writers=$(gh api "repos/$repo/keys" --jq '[.[] | select(.read_only == false)] | length')
if [ "$writers" != 0 ]; then
  echo "the repo already has $writers write deploy key(s); revoke first (see 'Revoke or rotate the key')" >&2
  exit 1
fi
gh api "repos/$repo/environments/publish" > /dev/null   # the environment must exist (step 1)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT          # the key files go, whatever happens
trap 'exit 130' INT TERM HUP       # Ctrl-C ends through the EXIT trap
ssh-keygen -q -t ed25519 -N "" -C "publish-bot $repo" -f "$tmp/key"
# the secret first, then the key: a failure in between leaves only an unregistered key in the environment, and a
# rerun replaces it
gh secret set PUBLISH_DEPLOY_KEY --env publish -R "$repo" < "$tmp/key"
gh repo deploy-key add "$tmp/key.pub" -R "$repo" --allow-write --title "$title"
ssh-keygen -l -f "$tmp/key.pub"
# check: exactly one key with write access, the publish bot's
gh api "repos/$repo/keys" --jq '.[] | {id, title, read_only}'
# check: the secret is in the environment, and there is no repo-level copy
gh secret list --env publish -R "$repo"
echo "repo-level secrets (PUBLISH_DEPLOY_KEY must not be listed):"
gh secret list -R "$repo"
SH
```

### 3. The ruleset on main: CI and Vercel required, only the deploy key bypasses

Required checks: `test-and-build` (the job in `.github/workflows/ci.yml`) and `Vercel` (Vercel's commit status; its
name is read from PR #11: `gh pr view 11 -R n-uf/n-uf.com --json statusCheckRollup`). Not strict (a PR need not be
up to date with main). No force-push, no deletion. Bypass: Deploy keys, always.

Click-path: github.com/n-uf/n-uf.com > Settings > Rules > Rulesets > New ruleset > New branch ruleset >
- Ruleset name `main: CI must pass (publish bot bypasses)`, Enforcement status **Disabled** (for now);
- Bypass list > Add bypass > **Deploy keys** (mode: Always allow);
- Target branches > Add target > **Include default branch**;
- Rules: tick **Restrict deletions**, **Block force pushes**, **Require status checks to pass** (leave "Require
  branches to be up to date" off) > Add checks: `test-and-build` and `Vercel`;
- Create.

Same with `gh` (created disabled; if a ruleset of that name exists it only prints it):

```sh
bash <<'SH'
set -euo pipefail
repo=n-uf/n-uf.com
name="main: CI must pass (publish bot bypasses)"
existing=$(gh api "repos/$repo/rulesets" --jq ".[] | select(.name == \"$name\") | .id")
if [ -n "$existing" ]; then
  echo "the ruleset already exists (id $existing):"
  gh api "repos/$repo/rulesets/$existing" --jq '{id, name, enforcement}'
  exit 0
fi
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
trap 'exit 130' INT TERM HUP
cat > "$tmp/ruleset.json" <<'EOF'
{
  "name": "main: CI must pass (publish bot bypasses)",
  "target": "branch",
  "enforcement": "disabled",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "bypass_actors": [ { "actor_type": "DeployKey", "actor_id": null, "bypass_mode": "always" } ],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "do_not_enforce_on_create": false,
        "required_status_checks": [ { "context": "test-and-build" }, { "context": "Vercel" } ]
      } }
  ]
}
EOF
gh api -X POST "repos/$repo/rulesets" --input "$tmp/ruleset.json" --jq '{id, name, enforcement}'
SH
```

### 4. Prove it, then switch the ruleset on

After this workflow is merged to main:

```sh
# a normal run: with nothing due only `build` runs and ends at "Nothing due."
gh workflow run publish.yml -R n-uf/n-uf.com --ref main
# the key path: runs only verify-key (key check, ls-remote of main over the pinned ssh); pushes nothing
gh workflow run publish.yml -R n-uf/n-uf.com --ref main -f verify-key=true
gh run list -R n-uf/n-uf.com --workflow publish.yml -L 2
```

When both runs are green, switch the ruleset on (safe to repeat):

```sh
bash <<'SH'
set -euo pipefail
repo=n-uf/n-uf.com
id=$(gh api "repos/$repo/rulesets" --jq '.[] | select(.name == "main: CI must pass (publish bot bypasses)") | .id')
[ -n "$id" ] || { echo "no ruleset of that name: run step 3 first" >&2; exit 1; }
gh api -X PUT "repos/$repo/rulesets/$id" -f enforcement=active --jq '{id, name, enforcement}'
SH
```

Once the ruleset is on, every change to `main` goes through a PR whose `test-and-build` and `Vercel` checks passed;
only the publish bot's key pushes directly.

## Revoke or rotate the key

Revoke at once if the key may have leaked (a changed workflow ran with it, a push to main you can't explain), and
rotate whenever you like. Until a new key is in place the daily run fails at its key check or its push, and the due
pages wait (still drafts with a past date, they go out on the first run after).

**1. Revoke** (the deploy key first: that ends its access at once; then the secret):

```sh
bash <<'SH'
set -euo pipefail
repo=n-uf/n-uf.com
gh repo deploy-key list -R "$repo"
for id in $(gh api "repos/$repo/keys" --jq '.[] | select(.read_only == false) | .id'); do
  gh repo deploy-key delete "$id" -R "$repo"
  echo "deleted write deploy key $id"
done
# the secret may already be gone on a rerun
gh secret delete PUBLISH_DEPLOY_KEY --env publish -R "$repo" || echo "no PUBLISH_DEPLOY_KEY in the publish environment"
gh repo deploy-key list -R "$repo"
SH
```

To revoke a single key instead of every write key: `gh repo deploy-key list -R n-uf/n-uf.com`, then
`gh repo deploy-key delete <id> -R n-uf/n-uf.com`, then
`gh secret delete PUBLISH_DEPLOY_KEY --env publish -R n-uf/n-uf.com`.

**2. Audit what reached main** (read-only). Every push the key made should be a `publish: <collection>/<slug>`
commit by github-actions[bot] that changes only `draft:` lines, made by a run of the `publish` workflow. GitHub shows
a deploy key's push under the account that added the key (activity type `push`, as on cl-audit), so tell
the key's pushes apart by their commit and their run, not by the actor:

```sh
bash <<'SH'
set -euo pipefail
repo=n-uf/n-uf.com
echo "pushes to main (newest first; force pushes and deletions show as such):"
gh api "repos/$repo/activity?ref=refs/heads/main&per_page=50" \
  --jq '.[] | "\(.timestamp) \(.activity_type) by \(.actor.login // "?"): \(.before[0:10])..\(.after[0:10])"'
echo "ruleset bypasses on main (the deploy key's pushes):"
gh api "repos/$repo/rulesets/rule-suites?ref=refs/heads/main&per_page=50" \
  --jq '.[] | select(.result == "bypass") | "\(.pushed_at) \(.actor_name // "?") \(.before_sha[0:10])..\(.after_sha[0:10])"'
echo "publish commits on main and what they changed:"
gh api "repos/$repo/commits?sha=main&per_page=100" \
  --jq '.[] | select(.commit.message | startswith("publish:")) | .sha' | while read -r sha; do
  gh api "repos/$repo/commits/$sha" \
    --jq '"\(.sha[0:10]) \(.commit.author.name) \(.commit.message | split("\n")[0])", (.files[] | "    \(.filename) +\(.additions) -\(.deletions)\n\(.patch)")'
done
echo "publish workflow runs:"
gh run list -R "$repo" --workflow publish.yml -L 20
SH
```

Anything else (another file, a body line, a push no publish run explains, a force push) is an incident: revert it in
a PR and keep the key revoked until the cause is found.

**3. Make a new key** with the script in step 2 of the setup above. It refuses while any write key is left, so it
can only run after the revoke, and it puts the secret in place before it registers the key.

**4. Prove it:** `gh workflow run publish.yml -R n-uf/n-uf.com --ref main -f verify-key=true` must be green.

### GitHub's pinned host key

The push and verify-key steps accept only GitHub's ed25519 host key, pinned in the workflow. If GitHub ever rotates
it, both fail with a host key error and nothing is pushed. Read the current key from GitHub's API (over HTTPS, not
ssh):

```sh
gh api meta --jq '.ssh_keys[] | select(startswith("ssh-ed25519"))'
```

and replace the old `ssh-ed25519 AAAA…` value, in a PR, in every place it appears (`git grep -n ssh-ed25519`):

- `.github/workflows/publish.yml`, the `known_hosts` line of the "Push to main" step (line 232 today);
- `.github/workflows/publish.yml`, the same line of the verify-key "List main over ssh" step (line 322 today);
- `scripts/publish-workflow.test.mjs`, the `HOST_KEY` constant (line 14), which the structure test checks both
  workflow lines against.

Then run the workflow with `verify-key` ticked.

## Security notes for reviewers

The deploy key bypasses every rule of the ruleset, force-push and deletion included. Only the push job's code keeps it
to due draft flips, so a change to `publish.yml` or `check-publish-patch.py` gets a security review by a lane other
than its author's. What must hold (and `scripts/publish-workflow.test.mjs` checks):

- the key lives only in the `publish` environment (main only), never at repo level;
- the key never shares a job with an install or build: `build` has no secret, `push` and `verify-key` run no node,
  npm, pnpm or npx, and the key appears only in the env of the key check, the push step and the ls-remote step;
- the push job checks out `${{ github.sha }}`, the commit the run started on, never one the build job names; only
  the patch and the page list cross between the jobs;
- the guard refuses anything but due `draft: true` -> `draft: false` lines inside front matter, before `git apply`
  runs, and again after every rebase with the copy saved from `github.sha`;
- the push goes to the explicit `git@github.com:n-uf/n-uf.com.git` as `HEAD:refs/heads/main`, never `--force`, over
  ssh with GitHub's ed25519 host key pinned and no ssh config, agent or proxy.

A deploy-key push starts other workflows (unlike a GITHUB_TOKEN push): today that is only `ci.yml`, which has no
effects. A future workflow on `push: main` must do nothing harmful on a `publish:` commit.
