# thing-server — notes for Claude

A simple REST API server that returns JSON "things" from a data file.
TypeScript + Express 5, Cucumber tests, Swagger UI at `/api-docs`, optional
`API_KEY` auth, graceful shutdown, multi-stage Docker on Node 24, published to
GHCR + Docker Hub via tag-triggered workflows.

## Remaining work (open GitHub issues)

Check these before starting new work — pick up, update, or close as appropriate.
Run `gh issue list` for the current state. There are currently no open issues.

## Conventions

- **Source layout:** `src/app.ts` exports a `createApp()` factory that builds
  the Express app (no `listen`); `src/index.ts` calls it, calls `listen`, prints
  the startup banner, and handles graceful shutdown. Keep this split — it is
  what lets the tests run in-process.
- **Config:** env is read *inside* `createApp()`, not at module load, so tests
  can build an app under a different `APP_NAME`/`BASE_PATH`. `API_KEY` is the
  exception — it is read per-request, so it can be toggled without rebuilding.
  Supported: `PORT`, `THINGSFILE`, `API_KEY`, `APP_NAME`, `BASE_PATH`.
  `BASE_PATH` prefixes everything via `joinUrlPath`, including the path from the
  data file, so `/v1` becomes `/api/svc1/v1`.
- **Build:** `npm run build` = `tsc` (→ `dist/`). `dist/` is gitignored and
  rebuilt by CI and the Docker builder stage. There is no asset-copy step —
  keep it that way; anything the runtime needs should be a `.ts` module that
  `tsc` compiles, not a file that has to be copied alongside.
- **tsconfig:** set options *explicitly*, never by default. TS 6 changed a pile
  of defaults (`strict` off→on, `module` commonjs→esnext, `target`→current-year
  ES, `rootDir`→`./`), so anything inherited silently changes meaning on a
  compiler bump. `strict`, `module`, `target` and `rootDir` are all pinned here
  for that reason. Under `strict`, an untyped JS dependency fails the build with
  TS7016 — either vendor it (see `src/uptime.ts`) or add a `src/types/*.d.ts`.
- **TypeScript 7 is the native Go port.** `tsc` is a prebuilt binary pulled in
  per-platform via optionalDependencies, not JS. Two consequences: it is
  **statically linked with no `libc` constraint**, so it works in the
  `node:24-alpine` builder stage (musl) — verified, not assumed; and 7.0 ships
  **without a compiler API** until 7.1, so typescript-eslint, webpack loaders
  and Volar-based tooling cannot consume it. None are used here; don't add one
  and expect it to work.
- **Runtime deps are deliberately minimal:** `express`, `cors` and
  `swagger-ui-express`, nothing else. `src/uptime.ts` is vendored from
  `@mitchallen/uptime` 0.0.8 (MIT, same author) rather than depended on — a
  dozen lines was not worth a package. Prefer vendoring or the Node stdlib over
  adding a dependency; this repo has a history of Dependabot churn from
  transitive trees far larger than the code they served.
- **Dependabot:** `.github/dependabot.yml` groups minor/patch by
  `dependency-type`, prod and dev separately. **Majors are never grouped** — in
  either scope. "Development" includes the TypeScript compiler, and a compiler
  major changes what the build enforces and emits, so it gets its own PR. Vet a
  major in a throwaway `git worktree`, never by installing into this checkout:
  `npm install` rewrites `package.json` + `package-lock.json`, and a later
  branch switch carries those onto the destination branch.
  Version updates run **monthly** (npm, docker and github-actions) to cut PR
  noise; security updates ignore the schedule and still open immediately. `@types/node`
  minor/patch bumps are ignored — only its majors come through. The docker
  `node` image ignores odd (non-LTS) majors by explicit range; extend the
  list before Node 33.
- **OpenAPI:** the spec lives in `src/openapi/`. Each fragment is a **function
  of the live routes**, not a static object: `buildSpec(definition, routes)` in
  `index.ts` calls every entry in `fragments` with the served `{ path, label,
  list }` and merges the results for `swagger-ui-express`. So a data file
  declaring path `/v2` and label `pets` documents `/v2/pets`, tags them `pets`,
  and derives a `Pet` schema from the actual items (`schema.ts`) — the docs
  cannot drift from the routes. **`routes.path` is the path *before* `BASE_PATH`
  is applied**, since `BASE_PATH` is carried by the spec's `servers` entry;
  passing the joined path would double-prefix every documented route.
  This replaced `swagger-jsdoc`, which dragged in a whole OpenAPI validator
  (`ajv`, `js-yaml`, `fast-uri`) and was a recurring source of Dependabot
  alerts. Don't reintroduce it — add new route docs as a fragment in
  `src/openapi/` and register it in `fragments`.
- **Tests:** `npm test` (Cucumber, `features/`). `pretest` runs the build, and
  the steps import `createApp` from `dist/app` and drive it in-process, so tests
  exercise the same compiled artifact the image ships. Requests go through
  `node:http` + the global `fetch` — deliberately dependency-free, replacing
  supertest and its superagent/form-data chain; keep it that way.
  A shared default app is reused; scenarios that set `APP_NAME`/`BASE_PATH` get
  their own instance, each with its own listener closed in `AfterAll`.
  Step definitions stay plain JS.
  CI (`.github/workflows/test.yml`) runs on push/PR to `main`, as
  `npm run test-coverage` — `c8` wrapping `cucumber-js` — with the table in the
  job summary and the report uploaded as the `coverage` artifact. Coverage is
  enforced at **100%** on all four measures (`check-coverage` + `100` in the
  `c8` block of `package.json`), so new code needs a scenario. Code JSON
  input cannot reach may take a `/* c8 ignore next */` with a comment saying
  why — not as a shortcut for testable branches. The README's coverage badge
  is a static `100%` backed by that threshold (a red `test` badge beside it
  means it failed); if the threshold ever changes, change the badge with it.
  The swagger explorer uses `swaggerUi.serveFiles(doc)`, not `swaggerUi.serve`:
  `serve` keeps the init script in module-level state, so with several apps in
  one process (as the tests build) every app served the last-built spec. `c8` is the
  Cucumber coverage tool; don't drop it to cut Dependabot noise (Node's
  built-in coverage only works with `node:test`).
- **Release:** bump the version and push a `v*` tag → the publish workflows build
  and push multi-platform images to GHCR + Docker Hub and sync the README to
  Docker Hub. See the README "Publish" section. In practice:
  `npm version X.Y.Z -m "X.Y.Z"` on a clean, up-to-date `main`, then
  `git push origin main` and `git push origin vX.Y.Z` (expect a "Bypassed rule
  violations" notice on the `main` push — admins aren't held to the required
  checks). Both publish workflows take ~1.5 min. Patch bump for a dependency
  update (1.0.32 = Express 5.3.0).
- **Deciding whether a release is due:** compare `main` against the latest tag
  and ignore `.github/` and `*.md` — CI and docs changes don't reach the image.
  A lockfile change only counts if it moves the *production* tree; compare the
  non-dev entries (`jq '.packages|to_entries[]|select(.value.dev!=true)'` on
  `package-lock.json` at the tag vs now). Dependabot auto-merges land on `main`
  without a release, so a production bump sits unshipped until someone tags it. `auto-release.yml`
  now does that weekly (see "Automated releases").
- **PR CI builds and smoke-tests the image** (the `docker` job in
  `.github/workflows/test.yml`), but only for the runner's platform — the
  `linux/arm64` half of the multi-platform build only runs at release. Its
  checks assert on the bundled `data/things.json` (`count` 3, item 1 `alpha`),
  so update them if that file changes.
- **Branch protection:** `main` requires the `test` and `docker` checks
  (set up 2026-10-20, matching random-server). `enforce_admins` is off, so
  direct version-bump pushes to `main` still work. Merge PRs with `--squash`
  — the history reads `title (#N)`.
- **Low-risk Dependabot PRs auto-merge** via
  `.github/workflows/dependabot-auto-merge.yml` (squash): all github-actions
  updates, plus npm/docker **minor and patch**. Majors always stay manual.
  This relies on the required checks above — native auto-merge waits for
  them, and without them it would land PRs with no CI gating. Added
  2026-10-20 and not yet exercised: on the first monthly Dependabot PR, check
  that the `auto-merge` job ran and the PR merged only after `test` + `docker`
  passed. Merges made by the workflow's `GITHUB_TOKEN` don't start a `push`
  run of `test.yml` on `main`; the PR's checks are the gate.
- **Express 5 everywhere now.** thing-server moved first; random-server caught
  up in 2.2.0. Because this repo's Dependabot runs **monthly** and
  random-server's weekly, bumps reach random-server first — when it ships a
  production dependency, run `npm outdated` here rather than waiting a month
  (Express 5.3.0 was hand-bumped in #102 the day random-server released it).
- **Node 26:** the image and CI are on Node 24. Node 26 enters LTS on
  **2026-10-28**; after that, move both `Dockerfile` stages *and*
  `test.yml`'s `node-version` together (the comment there says why), as
  random-server did. Dependabot's docker ignore list skips odd majors only, so
  expect it to propose 26 as its own PR.
- Default branch is `main`. Work on a branch and open a PR (CI gates merges).

## Automated releases

`.github/workflows/auto-release.yml` ships Dependabot updates without a
hand-cut release. Every Wednesday at 15:00 UTC it runs
`.github/scripts/auto-release.sh plan`. A release is due when `main` has
changes since the latest tag that reach the image, and every one was committed
by a bot. CI, docs and test changes and dev-only dependency bumps don't count.
When a release is due, it opens an `auto-release/vX.Y.Z` PR (patch version bump) with
auto-merge (squash) on, so it lands only once the required checks pass. When the
PR merges, the `tag` job tags the merge commit, and the tag push triggers the
publish workflows. It also creates the GitHub Release.

- **Anything a person changed is left alone.** A human commit touching
  image-affecting files, or entries under `[Unreleased]` in the changelog,
  makes `plan` skip with a reason in the run summary. Release those with
  the manual tag flow above.
- **Run it by hand:** `gh workflow run auto-release.yml -f dry-run=true`
  reports the decision without opening a PR; drop `dry-run` to release now.
- **Credentials:** pushes use a GitHub App token (repo variable
  `RELEASE_APP_CLIENT_ID`, secret `RELEASE_APP_PRIVATE_KEY`), because tags and
  PRs created with `GITHUB_TOKEN` don't trigger other workflows.
- **Keep it in sync.** The same script and workflow live in all eight sibling
  repos; only the `MERGE_METHOD` and `CREATE_RELEASE` env values differ.
