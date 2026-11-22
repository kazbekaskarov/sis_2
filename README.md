# SIS 2: Playwright test automation for Practice Software Testing

Automated tests (TypeScript, `@playwright/test`) for https://practicesoftwaretesting.com/.

## CI

[![Playwright Tests](https://github.com/kazbekaskarov/sis_2/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/kazbekaskarov/sis_2/actions/workflows/playwright.yml)

**CI system: GitHub Actions.** The repository already lives on GitHub, so Actions needs no server or extra account. It is free for public repositories, has built-in matrices for sharding and keeps artefacts on the run page. The status badge works without extra setup. GitLab CI would mean moving the repository. Jenkins would need a self-hosted server that GitHub webhooks cannot reach on localhost.

### Pipeline (`.github/workflows/playwright.yml`)

- **Triggers:** every `push` and every `pull_request` on any branch (no branch filter), plus `workflow_dispatch` for manual runs. A newer push to the same branch cancels the outdated run (`concurrency`).
- **Job `test`** (4 shards in parallel, `fail-fast: false`, 30 min timeout):
  1. start the Toolshop app in Docker (see [below](#why-ci-tests-a-self-hosted-copy-of-the-app));
  2. `actions/setup-node@v4` with Node 22 and `cache: npm` (the `~/.npm` cache is keyed on `package-lock.json`);
  3. `npm ci`;
  4. `npx playwright install --with-deps chromium`;
  5. seed the database and wait until the app answers;
  6. `npx playwright test --shard=i/4`: the full suite with no `--grep` or `--project` filter, against `http://localhost:4200` (or the `BASE_URL` repository variable if set).
- **Job `merge-reports`** runs after all shards, even when tests fail. It downloads the four blob reports and runs `npx playwright merge-reports --config merge.config.ts` to build one HTML report and one JUnit file.

### Artefacts

Uploaded with `if: ${{ !cancelled() }}`, so they also exist when tests fail.

| Artefact | Contents | Kept |
|---|---|---|
| `playwright-report` | merged HTML report from all shards (with traces) | 14 days |
| `test-results-1` … `test-results-4` | per shard: `trace.zip`, screenshots, videos, `reports/junit.xml` | 14 days |
| `junit-report` | merged `reports/junit-merged.xml` | 14 days |
| `blob-report-1` … `blob-report-4` | intermediate shard output for the merge job | 1 day |

To open a trace, download a `test-results-N` artefact and run `npx playwright show-trace <path>/trace.zip`, or drop the file onto https://trace.playwright.dev.

### CI settings in `playwright.config.ts`

All of them are switched on by the `CI` environment variable, which GitHub Actions sets automatically. Without it the config behaves as before on a developer machine.

| Setting | With `CI` set | Locally | Why |
|---|---|---|---|
| `forbidOnly` | `true` | `false` | a forgotten `test.only` fails the run instead of silently skipping the rest |
| `retries` | `2` | `0` | an unstable test is reported as flaky, not red |
| `workers` | `2` | auto | GitHub runners have 2–4 vCPUs |
| `reporter` | `list`, `blob`, `junit` (`reports/junit.xml`) | `list`, `html` | blob reports can be merged across shards; JUnit is understood by CI tools |
| `trace` | `on-first-retry` | same | a trace of exactly the attempt that failed first |
| `screenshot` / `video` | `only-on-failure` / `retain-on-failure` | same | evidence for failed tests |
| `baseURL` | `BASE_URL` env var, else `https://practicesoftwaretesting.com` | same | the target can be changed without code changes |

`fullyParallel: true` lets `--shard` split individual tests instead of whole files.

### Runtime: 1 job vs 4 shards

The same workflow was measured twice on GitHub Actions: first with the matrix temporarily set to one shard (`shardIndex: [1]`, `shardTotal: [1]`), then with four. Each variant was started 3 times with **Run workflow** (`workflow_dispatch`), one run at a time; the table shows the median. "Total" is the run's wall-clock time from start to finish. "Run tests" is the duration of the *Run Playwright tests* step; for the sharded runs it is the slowest shard.

| Configuration | Total run time (median) | Run tests step (median, slowest shard) | Runs (median run in bold) |
|---|---|---|---|
| 1 job, no sharding | 1 min 31 s | 15 s | [**run 1**](https://github.com/kazbekaskarov/sis_2/actions/runs/45035307386) (1:31 / 15 s), [run 2](https://github.com/kazbekaskarov/sis_2/actions/runs/45035454639) (1:34 / 19 s), [run 3](https://github.com/kazbekaskarov/sis_2/actions/runs/45035621335) (1:28 / 9 s) |
| 4 shards + merge | 1 min 29 s | 13 s | [run 1](https://github.com/kazbekaskarov/sis_2/actions/runs/45035981630) (1:23 / 14 s), [run 2](https://github.com/kazbekaskarov/sis_2/actions/runs/45036136156) (1:30 / 6 s), [**run 3**](https://github.com/kazbekaskarov/sis_2/actions/runs/45036295291) (1:29 / 13 s) |

All six runs passed with 5/5 tests. Measured on 2026-11-22 against the self-hosted Toolshop (see below). Total = run start to the end of the last job, including the merge job.

**Conclusion:** for this 5-test suite, 4 shards do not make the pipeline meaningfully faster (1 min 29 s vs 1 min 31 s, within run-to-run noise of about ±5 s). Each shard spends about 45 s on fixed setup, while the whole suite needs only 9–19 s of test time, so there is almost nothing to parallelise.

Why the gain is so small for this suite (step times from the runs above):

- **Fixed setup cost per shard.** Every shard repeats the same setup, and none of it gets shorter when the tests are split:
  - starting the Toolshop containers: 20–27 s;
  - installing Chromium with system packages: 19–31 s;
  - checkout, Node setup, `npm ci` (from cache, 1–2 s), seeding the database (2–3 s).
- **Too little test time to split.** 5 tests take 9–19 s in a single job. With 4 shards each one runs 1–2 tests in 2–14 s, so splitting saves a few seconds at most, and the variance between runs is larger than that.
- **The slowest test sets the floor.** `buy-product` (full checkout) is the longest test, and sharding cannot make one test faster.
- **The merge job runs after the shards.** It adds a job start, `npm ci` and the merge (9–18 s) to the critical path.
- **Runner start-up varies.** The four shards start at slightly different times, and the run waits for the last one.
- Sharding pays off once each shard's test time is clearly longer than its setup time, for example with dozens of slow end-to-end tests or several browsers. For this suite a single job would be just as fast and use a quarter of the runner minutes. The 4-shard matrix is kept because the assignment asks for it, and it is ready for a larger suite.

### Why CI tests a self-hosted copy of the app

The first CI runs against the public site failed. practicesoftwaretesting.com sits behind Cloudflare, which served a "Performing security verification" page instead of the login form to the GitHub runners' datacenter IP addresses. As a result the three tests that sign in (`register`, `login`, `buy-product`) timed out on every attempt. The `error-context.md` page snapshots in those runs' `test-results-N` artefacts show the challenge page. The same tests passed from a local machine.

The pipeline does not try to get around the bot protection. Instead, each shard starts its own copy of the Toolshop app (`toolshop/docker-compose.yml`):

- the official `testsmith/practice-software-testing-sprint5-api` / `-ui` images, pinned to `2.5`;
- MariaDB;
- nginx with upstream's `vhost.conf` (`toolshop/nginx.conf`). The prebuilt `-web` image only exists for arm64, so it does not start on the amd64 runner.

The workflow seeds the database with `php artisan migrate:fresh --seed`, waits for the API (`:8091`) and the UI (`:4200`), and runs the suite with `BASE_URL=http://localhost:4200`. Every shard gets a fresh database, so shards cannot affect each other's data. To test the public site (or any other deployment) instead, set the `BASE_URL` repository variable under Settings → Secrets and variables → Actions → Variables. The local app is then not started.

### Running locally

Clean install, as in CI:

```bash
npm ci
npx playwright install --with-deps chromium   # --with-deps only installs packages on Linux
```

Run with the CI configuration. bash / zsh / Git Bash:

```bash
CI=true npx playwright test
```

PowerShell:

```powershell
$env:CI = "true"; npx playwright test; Remove-Item Env:CI
```

Afterwards `blob-report/` and `reports/junit.xml` exist. To check `forbidOnly`, temporarily change one `test(` to `test.only(`: the CI-mode run fails with "item focused with '.only' is not allowed".

Shards plus report merge (Git Bash):

```bash
mkdir -p all-blob-reports
CI=true npx playwright test --shard=1/2 && cp blob-report/*.zip all-blob-reports/
CI=true npx playwright test --shard=2/2 && cp blob-report/*.zip all-blob-reports/
npx playwright merge-reports --config merge.config.ts ./all-blob-reports
npx playwright show-report
```

PowerShell:

```powershell
New-Item -ItemType Directory -Force all-blob-reports | Out-Null
$env:CI = "true"
npx playwright test --shard=1/2; Copy-Item blob-report\*.zip all-blob-reports\
npx playwright test --shard=2/2; Copy-Item blob-report\*.zip all-blob-reports\
Remove-Item Env:CI
npx playwright merge-reports --config merge.config.ts ./all-blob-reports
npx playwright show-report
```

In the Linux environment of the runner, using the Playwright image that matches `@playwright/test` 1.64.1 (bash / WSL2; in PowerShell use `${PWD}` instead of `$(pwd)`):

```bash
docker run --rm -it --ipc=host -v "$(pwd)":/work -w /work -e CI=true \
  mcr.microsoft.com/playwright:v1.64.1-noble \
  bash -c "npm ci && npx playwright test"
```

`npm ci` inside the container replaces `node_modules` with Linux builds, so run `npm ci` again on the host afterwards.

The workflow itself with [act](https://github.com/nektos/act) (Docker Desktop running):

```bash
act -l
act push -j test --matrix shardIndex:1 \
  -P ubuntu-latest=catthehacker/ubuntu:act-latest \
  --artifact-server-path ./.act-artifacts
```

## Install and run

Requires Node.js 20 or 22 LTS.

```bash
npm ci                              # installs the exact versions from package-lock.json
npx playwright install chromium     # downloads the browser (add --with-deps on Linux)
npx playwright test                 # runs all tests in parallel
npx playwright show-report   # opens the HTML report
```

Useful variants:

```bash
npx playwright test tests/login.spec.ts   # one spec
npx playwright test --headed              # watch the browser
npm run typecheck                         # TypeScript check only
```

## Test cases (one spec file each, one test each)

| # | Spec | What it proves |
|---|------|----------------|
| 1 | `tests/register.spec.ts` | A new customer registers, then signs in with the same credentials |
| 2 | `tests/login.spec.ts` | Valid login reaches the account page; invalid login shows an error and does not |
| 3 | `tests/buy-product.spec.ts` | Add a product with quantity 2, verify it in the cart, complete checkout |
| 4 | `tests/compare-products.spec.ts` | Capture name and price of two products and compare them |
| 5 | `tests/reset-password.spec.ts` | Known email shows confirmation; invalid email shows an error |

## Architecture

- `pages/`: Page Object Model. All locators live here and are private; pages expose business actions (`signIn`, `registerUser`, `addProductToCart`, `checkout`) and `expect*` assertions.
- `fixtures/pages.fixture.ts`: extends Playwright's `test` so specs receive page objects (`loginPage`, `cartPage`, ...). Specs import `test` and `expect` only from here.
- `data/user.factory.ts`: generates a new customer per call with a unique email (UUID based).
- `playwright.config.ts`: `baseURL`, `testIdAttribute: 'data-test'`, Chromium project, `fullyParallel`, retries only on CI, trace on first retry.

## Independence and parallelism

- Every test gets a fresh browser context.
- Registration and checkout use a freshly generated user, so no test depends on another test's data.
- Login registers its own user. Only the reset-password test uses the seeded demo email (`customer@practicesoftwaretesting.com`), and it only requests a reset.
- Products are selected by name, never by position, and no test asserts catalogue size.

## Known limitations

- The target is a public shared demo site; its data can be reset or changed by others, and it can be slow.
- Product stock is finite and shared: the purchase test buys the first in-stock product from a candidate list, and a product can run out after many orders.
- The order API validates the billing address through an external lookup that sometimes answers HTTP 422, so the checkout page object re-submits "Confirm" until the invoice confirmation appears.
- The site locks an account after repeated failed logins, so the login test registers its own user and never fails a login against a shared account.

## Verifying selectors with codegen

```bash
npx playwright codegen https://practicesoftwaretesting.com --test-id-attribute=data-test
```
