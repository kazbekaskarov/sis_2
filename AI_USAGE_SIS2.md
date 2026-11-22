# AI usage: SIS 2 CI pipeline

This file documents how AI was used for the second part of SIS 2: the GitHub Actions CI pipeline for the existing Playwright suite. The AI usage for the test suite itself is documented in [Prompt.md](Prompt.md) and [Review.md](Review.md).

## Tool and model

| Item | Value |
|---|---|
| Tool | Claude Code (VS Code extension), agent mode with shell, git and `gh` access |
| Model | Claude Opus 5.5 (`claude-opus-5-5`), as reported by the tool's session information |
| Effort / thinking setting | [ADD YOUR RESULT HERE: the effort level you had selected, if any; it is not recorded in the session] |
| Date | 2026-11-22 (one session) |
| Repository | https://github.com/kazbekaskarov/sis_2, PR [#1](https://github.com/kazbekaskarov/sis_2/pull/1) |

The AI ran commands itself (npm, Playwright, git, `gh`, Docker) and reported their real output. Every claim about CI below is backed by a run on GitHub Actions; the run IDs are linked.

## Result

| Requirement | Where it is |
|---|---|
| 1. Runs on every push and PR | `.github/workflows/playwright.yml` (`push`, `pull_request`, no branch filter, plus `workflow_dispatch`) |
| 2. Cached dependencies, browsers, full suite | `setup-node` with `cache: npm`, `npm ci`, `npx playwright install --with-deps chromium`, `npx playwright test --shard=i/4` without filters |
| 3. HTML report and traces as artefacts, ≥ 7 days | `playwright-report`, `test-results-1..4`, `junit-report`, kept 14 days; `trace: 'on-first-retry'` |
| 4. CI-specific configuration | `playwright.config.ts`: `forbidOnly`, `retries: 2`, `workers: 2`, `junit` + `blob` reporters when `CI` is set; `merge.config.ts` |
| 5. Parallelism + runtime before/after | 4-shard matrix + `merge-reports` job; timing table in README |
| 6. Status badge for main | README, shows "passing" after the merge ([run on main](https://github.com/kazbekaskarov/sis_2/actions/runs/45036908003)) |

## Prompts and what the AI did

The prompts are reproduced verbatim, in the order they were sent. Prompts 10–12 were written in Russian; an English translation is given in brackets.

### Prompt 1: Plan

```text
Read the SIS assignment (pasted below) and the current repo: playwright.config.ts,
package.json, .gitignore, README.md, Prompt.md. Make a plan of which files to create
or change to cover all 6 requirements and the submission checklist. Don't write code yet.

[full text of the assignment guide "SIS 2: CI pipeline for Playwright step-by-step guide" pasted here]
```

**AI did:** read the five files, the list of tracked files and `package-lock.json`. It found that `forbidOnly`, `retries` and the trace setting already existed, the lock file was committed (`@playwright/test` 1.64.1), and the tests use no hard-coded credentials (users are generated). It proposed a file-by-file plan and the order of steps for collecting checklist evidence. It also flagged two risks: the deadline was the same day, and the `postinstall` script in `package.json` would download Chromium during every `npm ci`.

### Prompt 2: CI config

```text
Update playwright.config.ts for CI:
- const isCI = !!process.env.CI;
- forbidOnly: isCI, retries: isCI ? 2 : 0, workers: isCI ? 2 : undefined, fullyParallel: true;
- reporters in CI: list + blob + junit (reports/junit.xml); locally: list + html (open: 'never');
- baseURL from process.env.BASE_URL, defaulting to https://practicesoftwaretesting.com;
- trace: 'on-first-retry', screenshot: 'only-on-failure', video: 'retain-on-failure';
- keep testIdAttribute 'data-test'.
Create merge.config.ts in the root (html open: 'never' + junit reports/junit-merged.xml).
Add to .gitignore: node_modules/, test-results/, playwright-report/, blob-report/,
reports/, all-blob-reports/, .act-artifacts/, .secrets.
Then run npx tsc --noEmit.
```

**AI did:** rewrote `playwright.config.ts`, created `merge.config.ts` and extended `.gitignore`. The first `npx tsc --noEmit` failed (see error 1 below). After `npm ci --ignore-scripts` the type check passed.

### Prompt 3: Local CI check

```text
Check locally everything CI will do (Windows, Git Bash):
1. npm ci
2. CI=true npx playwright test. blob-report/ and reports/junit.xml must exist afterwards.
3. Temporarily change one test( to test.only(, run with CI=true and confirm the run fails
   because of forbidOnly. Then revert the change.
4. Run two shards (--shard=1/2 and 2/2), copying blob-report/*.zip into all-blob-reports/
   after each, then run npx playwright merge-reports --config merge.config.ts ./all-blob-reports
   and check that reports/junit-merged.xml contains tests from both shards.
Show me the command output. If something fails, find the root cause instead of working around it.
```

**AI did:** ran all four checks and showed the output. All passed:

- the CI-mode run passed 5 tests with 2 workers and wrote `blob-report/report.zip` and `reports/junit.xml`;
- `test.only` in `tests/reset-password.spec.ts` made the run fail with "item focused with '.only' is not allowed due to the 'forbidOnly' option" (exit 1), and the change was reverted with `git checkout`;
- shard 1/2 ran 3 tests and shard 2/2 ran 2; the merged `junit-merged.xml` had `tests="5" failures="0"`.

### Prompt 4: Workflow

```text
Create .github/workflows/playwright.yml:
- triggers: push, pull_request (no branch filter), workflow_dispatch;
- concurrency with cancel-in-progress;
- job test: matrix shardIndex [1,2,3,4], shardTotal [4], fail-fast: false, timeout 30 min;
  checkout@v4, setup-node@v4 (node 22, cache: npm), npm ci,
  npx playwright install --with-deps chromium,
  npx playwright test --shard=i/4 with no --grep or --project, BASE_URL env from vars with a fallback;
  upload blob-report-N (retention 1) and test-results-N (test-results/ + reports/, retention 14)
  with if: ${{ !cancelled() }};
- job merge-reports: needs test, if !cancelled(), download-artifact with pattern blob-report-*
  and merge-multiple, merge-reports --config merge.config.ts, upload playwright-report
  and junit-report (retention 14).
Note that package.json has a postinstall "playwright install chromium", so the merge job
will download a browser it doesn't need. Suggest a fix (e.g. PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
in the merge job, or removing postinstall) and explain your choice.
```

**AI did:** created the workflow. Before choosing a fix for `postinstall`, it read the Playwright 1.64.1 source and tested `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` (see error 2). Because that variable does not work here, it removed `postinstall` and updated the README install section (Node 20/22, separate `npx playwright install chromium`). It also put the `BASE_URL` fallback in the workflow expression: an unset repository variable becomes an empty string, and `??` in the config does not replace an empty string.

### Prompt 5: act and Docker

```text
Help me run the workflow locally with act on Windows (Docker Desktop + WSL2):
first act -l, then one shard:
act push -j test --matrix shardIndex:1 -P ubuntu-latest=catthehacker/ubuntu:act-latest --artifact-server-path ./.act-artifacts
Also give me the command to run the tests in the mcr.microsoft.com/playwright image,
with the version matching @playwright/test in package-lock.json.
```

**AI did:**

- installed `act` 0.2.98 from the official GitHub release, after checking the SHA-256 against `checksums.txt` (winget was not available);
- started Docker Desktop;
- ran `act -l`, which listed the `test` and `merge-reports` jobs and the three events;
- started the shard 1 job with `act`; it failed later on a network error (see error 7);
- checked that the image `mcr.microsoft.com/playwright:v1.64.1-noble` exists and provided the `docker run` command (it is in the README).

### Prompt 6: Branch, PR, first runs

```text
Create a feature/ci-pipeline branch, commit the changes, push, and open a PR into main with gh.
Then use gh run list / gh run view to confirm two runs started (push and pull_request)
and that the 4 shards and Merge reports are visible. If anything fails, go through the logs (gh run view --log-failed).
```

**AI did:** created the branch, committed, pushed and opened [PR #1](https://github.com/kazbekaskarov/sis_2/pull/1). A [push run](https://github.com/kazbekaskarov/sis_2/actions/runs/45032953556) and a [pull_request run](https://github.com/kazbekaskarov/sis_2/actions/runs/45032965028) both started, each with 4 shards and Merge reports. Both failed: 3 of 5 tests timed out on every attempt (see error 3).

### Prompt 7: Re-run, cache, artefacts

```text
Re-run the workflow (gh workflow run playwright.yml --ref feature/ci-pipeline).
In the second run, find the line in the setup-node log saying the npm cache was restored, and show it.
Check that the run has the playwright-report, test-results-1..4 and junit-report artifacts,
and that test-results contains trace.zip files (if any retries happened).
```

**AI did:** waited for the push run to finish before dispatching. A `workflow_dispatch` on the same branch is in the same concurrency group, and `cancel-in-progress` would have cancelled the push run needed as evidence. In the [dispatch run](https://github.com/kazbekaskarov/sis_2/actions/runs/45033307403) it found the npm cache line in every job:

```text
Cache hit for: node-cache-Linux-x64-npm-2d9f96a1d3f55019d8e92f5503ed09b2928bc3f7feca1cd241abf11d46de6724
Cache Size: ~9 MB (8940177 B)
Cache restored successfully
```

All artefacts were present (`playwright-report`, `junit-report`, `test-results-1..4` for 14 days, `blob-report-1..4` for 1 day). `trace.zip` files from the first retry were in `test-results-1`, `-2` and `-3`. The AI also analysed the failures and found the Cloudflare bot check (error 3). It refused to bypass the bot protection and proposed three legitimate options.

### Prompt 8: Timing measurement

```text
I need to compare run times:
1. Temporarily set the matrix to shardIndex: [1], shardTotal: [1], push, and trigger
   workflow_dispatch 3 times.
2. Restore [1,2,3,4] / [4] and do 3 more runs.
3. Use gh run view --json to get each run's total duration and the duration of the
   "Run Playwright tests" step (for sharded runs, the slowest shard). Calculate the medians
   and give me the run links.
```

**AI did:** pushed the single-shard matrix and started a script that runs the dispatches strictly one after another, because overlapping runs on one branch cancel each other. This first measurement was stopped after prompt 10, before any dispatch had run: timing red runs full of 30-second retries would have been meaningless. It was repeated after the fix (prompt 12).

### Prompt 9: README CI section

```text
Add a "## CI" section to README.md:
- a badge for main (take <owner>/<repo> from git remote);
- CI system: GitHub Actions and why it was chosen;
- a description of the pipeline, the artifacts, and the CI settings in playwright.config.ts;
- a Runtime table with the medians and run links from the previous step, plus an honest conclusion
  (each shard spends about a minute on setup and has only ~5 spec files to run, so the gain may be small; explain why);
- "Running locally" instructions (bash and PowerShell).
```

**AI did:** wrote the CI section: badge, the reason for choosing GitHub Actions, the pipeline, an artefact table, a CI settings table, the reasons the gain is small, and local run commands for bash, PowerShell, Docker and act. The timing numbers did not exist yet, so the table was left with explicit `TBD` placeholders instead of invented values. It was not committed at once, because a push would have cancelled a running timing run.

### Prompt 10: Fix

```text
пофикси
```

[English: "fix it"]

**AI did:** interpreted this as fixing the red CI runs, using the option it had recommended: test against a self-hosted copy of the Toolshop app.

- stopped the timing script;
- read the upstream repository `testsmith-io/practice-software-testing` (compose files, seed script) and checked the Docker Hub tags (`2.5`, 2026-09-09);
- wrote `toolshop/docker-compose.yml` and the workflow steps: start the app, seed the database, wait for the API and UI, run the tests against `http://localhost:4200`;
- tried to start the stack locally before pushing, but the tool's safety classifier blocked `docker compose up` (see error 6). The AI did not work around the block and asked how to proceed.

### Prompt 11: Push and debug in CI

```text
запуш сразу и отлаживать будем в CI
```

[English: "push it right away and we'll debug in CI"]

**AI did:** pushed the fix. The first run on GitHub failed because the prebuilt web-server image exists only for arm64 (error 4). The AI replaced it with the official `nginx:1.23.3-alpine` image and upstream's `vhost.conf`, and pushed again. The next [push run](https://github.com/kazbekaskarov/sis_2/actions/runs/45034888451) and [PR run](https://github.com/kazbekaskarov/sis_2/actions/runs/45034892888) were green: 5/5 tests, merged JUnit `tests="5" failures="0"`, no retries. While debugging, it found that the stopped timing script was still running (error 5) and killed it. It then rewrote the README section about the bot protection.

### Prompt 12: Repeat the measurement

```text
да
```

[English: "yes", an answer to "Should I start the timing measurements?"]

**AI did:** ran both phases with one script, each run starting only after the previous one finished (12 runs, all green), then calculated the medians:

| Configuration | Total (median) | Run tests step (median, slowest shard) |
|---|---|---|
| 1 job | 1 min 31 s | 15 s |
| 4 shards + merge | 1 min 29 s | 13 s |

It filled in the README table with all six run links and wrote the conclusion: 4 shards give no meaningful gain for 5 tests, because each shard spends about 45 s on setup while the whole suite needs 9–19 s. Step times were taken from the run data; the claim "merge takes about 20 s" was checked against the runs and corrected to the measured 9–18 s.

### Prompt 13: Merge

```text
Merge the PR into main with gh, wait for the run on main, and check that the badge shows a status.
```

**AI did:** checked that the PR was `MERGEABLE`/`CLEAN` with all checks green, merged it with a merge commit (`b077d3d`) so that the timing commits stay in the history, and waited for the [run on main](https://github.com/kazbekaskarov/sis_2/actions/runs/45036908003) (success). It then fetched the badge SVG from the README URL; its title is "Playwright Tests - passing".

### Prompt 14: This document

```text
Create AI_USAGE_SIS2.md (or extend Prompt.md) covering: the model used
(Claude Opus 5.5 in Claude Code), the full list of prompts step by step, what the AI did
at each step, what I checked and fixed by hand, and what errors came up and how
they were resolved. Commit it to main.
```

**AI did:** wrote this file, added a pointer to it in `Prompt.md` and committed both to `main`.

## Errors and how they were resolved

| # | Error | Root cause | Resolution |
|---|---|---|---|
| 1 | `npx tsc --noEmit` printed "This is not the tsc command you are looking for" | `node_modules` was not installed, so `npx` fetched an unrelated npm package called `tsc` | `npm ci --ignore-scripts`, then the type check passed |
| 2 | `postinstall` downloaded Chromium inside every `npm ci`, including the merge job, which needs no browser | the script ran `playwright install chromium`. The suggested `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` does not help: in Playwright 1.64.1 the variable is only checked by the npm-install hook, not by the CLI. A test with the variable set still started a 197.5 MiB download | removed `postinstall`; CI installs Chromium in its own step; README tells local users to run `npx playwright install chromium` |
| 3 | On GitHub runners `register`, `login` and `buy-product` timed out on all 3 attempts (`waiting for getByTestId('email')`) | practicesoftwaretesting.com is behind Cloudflare, which served a "Performing security verification" page instead of the login form to datacenter IP addresses. All 9 failure snapshots (`error-context.md`) showed this page. Locally all tests passed | no attempt to bypass the bot protection. CI now starts its own copy of the Toolshop app from the official images (`toolshop/docker-compose.yml`) and tests `http://localhost:4200`; the `BASE_URL` repository variable can still point CI at any other deployment |
| 4 | After the fix every shard failed in "Seed database and wait for Toolshop" (`curl` exit 7 on `:8091`) | `testsmith/practice-software-testing-web` is published for arm64 only; on the amd64 runner the container died with `exec format error` | use `nginx:1.23.3-alpine` with upstream's `vhost.conf` (`toolshop/nginx.conf`), which is what that image's Dockerfile builds |
| 5 | A push run on the fix commit was cancelled | **AI mistake:** the first timing script had been stopped, but on Windows its bash process kept running as an orphan and dispatched two runs; the newer one cancelled the push run through `concurrency` | the orphaned processes were found by command line and killed; the timing was repeated later with a new script; a push run for the PR exists from the first commit |
| 6 | Starting the app locally with `docker compose up` was blocked | the safety classifier of Claude Code's auto mode denied the command | the AI did not work around it (not even by testing the same images on GitHub without asking); the user decided to debug directly in CI |
| 7 | The local `act` run of shard 1 failed | network error while `act` was cloning `actions/setup-node`: "An existing connection was forcibly closed by the remote host"; it also used an older version of the workflow | not repeated; `act -l` worked, and the real runs on GitHub are the evidence the assignment requires |

## What I checked and changed by hand

[ADD YOUR RESULT HERE: list what you verified yourself. Suggestions, keep only what you actually did:]

- [ADD YOUR RESULT HERE: reviewed `playwright.config.ts`, `merge.config.ts` and `.github/workflows/playwright.yml` against the assignment]
- [ADD YOUR RESULT HERE: opened the Actions tab and the run graph with 4 shards + Merge reports]
- [ADD YOUR RESULT HERE: downloaded a `test-results-N` artefact and opened `trace.zip` in trace.playwright.dev, e.g. from run 45033307403]
- [ADD YOUR RESULT HERE: checked the badge on the repository front page]
- [ADD YOUR RESULT HERE: checked Settings → Actions → General (Actions allowed, artefact retention ≥ 14 days)]

Decisions the user made during the session:

- chose to push the Toolshop fix and debug it in CI, instead of granting permission to run Docker locally (prompt 11);
- approved repeating the timing measurement after the fix (prompt 12);
- asked for the merge into `main` (prompt 13).

## Limits and honest notes

- CI tests a self-hosted copy of the Toolshop app (image version `2.5`), not the public site, because the public site blocks GitHub runners. Locally the config still defaults to the public site.
- Sharding is required by the assignment but does not speed up this small suite (see the README timing table).
- `forbidOnly` was demonstrated locally (prompt 3), not with a red CI run.
- The `trace.zip` files come from the red runs before the fix; the green runs have no retries and therefore no traces.
