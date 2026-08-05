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
- **Build:** `npm run build` = `tsc` (→ `dist/`) + `copyfiles` for the `*.yaml`.
  `dist/` is gitignored and rebuilt by CI and the Docker builder stage. The
  swagger `apis` paths point at the copied `./dist/*.yaml`, resolved against the
  process cwd — not at `src/`.
- **Tests:** `npm test` (Cucumber, `features/`). `pretest` runs the build, and
  the steps import `createApp` from `dist/app` and drive it in-process via
  supertest, so tests exercise the same compiled artifact the image ships.
  A shared default app is reused; scenarios that set `APP_NAME`/`BASE_PATH` get
  their own instance. Step definitions stay plain JS.
  CI (`.github/workflows/test.yml`) runs on push/PR to `main`.
- **Release:** bump the version and push a `v*` tag → the publish workflows build
  and push multi-platform images to GHCR + Docker Hub and sync the README to
  Docker Hub. See the README "Publish" section.
- **Keep Express 5** — thing-server is intentionally ahead of random-server here.
- Default branch is `main`. Work on a branch and open a PR (CI gates merges).
