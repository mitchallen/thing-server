# thing-server — notes for Claude

A simple REST API server that returns JSON "things" from a data file.
JavaScript + Express 5, Cucumber tests, Swagger UI at `/api-docs`, optional
`API_KEY` auth, graceful shutdown, multi-stage Docker on Node 24, published to
GHCR + Docker Hub via tag-triggered workflows.

## Remaining work (open GitHub issues)

Check these before starting new work — pick up, update, or close as appropriate.
Run `gh issue list` for the current state.

- **[#49 Migrate from JavaScript to TypeScript](https://github.com/mitchallen/thing-server/issues/49)** — the main remaining parity gap with random-server.
- **[#50 Support APP_NAME and BASE_PATH environment overrides](https://github.com/mitchallen/thing-server/issues/50)** — match random-server's runtime configurability.

## Conventions

- **Source layout:** `src/app.js` builds and exports the Express app (no
  `listen`); `src/index.js` requires it, calls `listen`, and handles graceful
  shutdown. Tests import `src/app.js` in-process via supertest.
- **Tests:** `npm test` (Cucumber, `features/`). CI (`.github/workflows/test.yml`)
  runs on push/PR to `main`.
- **Release:** bump the version and push a `v*` tag → the publish workflows build
  and push multi-platform images to GHCR + Docker Hub and sync the README to
  Docker Hub. See the README "Publish" section.
- **Keep Express 5** — thing-server is intentionally ahead of random-server here.
- Default branch is `main`. Work on a branch and open a PR (CI gates merges).
