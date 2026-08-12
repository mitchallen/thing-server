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
  CI (`.github/workflows/test.yml`) runs on push/PR to `main`.
- **Release:** bump the version and push a `v*` tag → the publish workflows build
  and push multi-platform images to GHCR + Docker Hub and sync the README to
  Docker Hub. See the README "Publish" section.
- **Keep Express 5** — thing-server is intentionally ahead of random-server here.
- Default branch is `main`. Work on a branch and open a PR (CI gates merges).
