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

## How a draft goes live

1. The page merges to `main` as `src/content/<collection>/<slug>.md` (papyrus today; any folder directly under
   `src/content` counts, with no change to the scripts) with, in its front matter:
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
     pages listed. Then it commits `publish: papyrus/<slug>[, …]` as github-actions[bot] and pushes to `main`. If
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

### 1. The `publish` environment, limited to main

Click-path: github.com/n-uf/n-uf.com > Settings > Environments > New environment > name `publish` > Configure
environment > Deployment branches and tags: **Selected branches and tags** > Add deployment branch or tag rule >
Ref type **Branch**, name pattern `main` > Add rule. (No required reviewers, no wait timer.)

Same with `gh`:

```sh
echo '{"deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true}}' \
  | gh api -X PUT repos/n-uf/n-uf.com/environments/publish --input -
gh api -X POST repos/n-uf/n-uf.com/environments/publish/deployment-branch-policies -f name=main -f type=branch
# check: one policy, the branch main
gh api repos/n-uf/n-uf.com/environments/publish/deployment-branch-policies --jq '.branch_policies[] | {name, type}'
```

### 2. The write deploy key, its private half in the environment

It must be the repo's **only** write deploy key: the ruleset's bypass applies to every deploy key.

Click-path: make the key pair locally (first two lines of the script below), then github.com/n-uf/n-uf.com >
Settings > Deploy keys > Add deploy key > Title `publish-bot (scheduled publishing)`, Key: the contents of `key.pub`,
tick **Allow write access** > Add key. Then Settings > Environments > `publish` > Environment secrets > Add
environment secret > Name `PUBLISH_DEPLOY_KEY`, Value: the whole contents of the private `key` file > Add secret.
Delete the local key files.

Same with `gh` (prints only the fingerprint, never key material):

```sh
tmp=$(mktemp -d)
ssh-keygen -q -t ed25519 -N "" -C "publish-bot n-uf/n-uf.com" -f "$tmp/key"
gh repo deploy-key add "$tmp/key.pub" -R n-uf/n-uf.com --allow-write --title "publish-bot (scheduled publishing)"
gh secret set PUBLISH_DEPLOY_KEY --env publish -R n-uf/n-uf.com < "$tmp/key"
ssh-keygen -l -f "$tmp/key.pub"
rm -P "$tmp/key" && rm -rf "$tmp"
# check: exactly one key with write access, the publish bot's
gh api repos/n-uf/n-uf.com/keys --jq '.[] | {title, read_only}'
# check: the secret is in the environment, and there is no repo-level copy
gh secret list --env publish -R n-uf/n-uf.com
gh secret list -R n-uf/n-uf.com
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

Same with `gh` (created disabled):

```sh
cat > /tmp/nuf-ruleset.json <<'EOF'
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
gh api -X POST repos/n-uf/n-uf.com/rulesets --input /tmp/nuf-ruleset.json --jq '{id, name, enforcement}'
rm /tmp/nuf-ruleset.json
```

### 4. Prove it, then switch the ruleset on

After this workflow is merged to main:

```sh
# a normal run: with nothing due only `build` runs and ends at "Nothing due."
gh workflow run publish.yml -R n-uf/n-uf.com --ref main
# the key path: runs only verify-key (key check, ls-remote of main over the pinned ssh); pushes nothing
gh workflow run publish.yml -R n-uf/n-uf.com --ref main -f verify-key=true
gh run list -R n-uf/n-uf.com --workflow publish.yml -L 2
# then, with <id> from the create call above (or: gh api repos/n-uf/n-uf.com/rulesets --jq '.[] | {id, name}')
gh api -X PUT repos/n-uf/n-uf.com/rulesets/<id> -f enforcement=active
```

Once the ruleset is on, every change to `main` goes through a PR whose `test-and-build` and `Vercel` checks passed;
only the publish bot's key pushes directly.

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
