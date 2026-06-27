# Tasks: E2E Test Setup with Playwright

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~610 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Infra + backend + helpers (phases 1-3) → PR 2: Specs + config (phases 4-5) |
| Delivery strategy | single-pr-default |
| Chain strategy | pending |
| Actual implementation | Single PR (all phases), size:exception |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High
Resolution: single-pr-default with size:exception (all phases implemented together)

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Infrastructure, backend dev endpoints, seed command, helpers, .env.testing | PR 1 | base=feature/charlando-ando; ~330 lines |
| 2 | All 4 spec files, config.yaml update, full verification | PR 2 | base=PR 1 branch; ~280 lines |

## Phase 1: Foundation (PR 1)

- [x] 1.1 Install `@playwright/test` and Chromium: `npm install -D @playwright/test && npx playwright install chromium`
- [x] 1.2 Create `playwright.config.js` with `baseURL`, `webServer`, Desktop Chrome + Mobile Safari projects, 30s timeout
- [x] 1.3 Create `.env.testing` with `APP_ENV=testing`, `DB_CONNECTION=sqlite`, `DB_DATABASE=database/testing.sqlite`, `APP_KEY` from `.env`
- [x] 1.4 Update `.gitignore` — add `test-results/`, `playwright-report/`, `database/testing.sqlite`
- [x] 1.5 Update `package.json` — add `"test:e2e": "npx playwright test"` to scripts
- [x] 1.6 Touch `database/testing.sqlite` so git tracks the file

## Phase 2: Backend Dev Endpoints (PR 1)

- [x] 2.1 Create `app/Console/Commands/E2eSeedCommand.php` — reset DB, seed test user + 2 servers
- [x] 2.2 Create `database/seeders/E2eSeeder.php` with `run()`: user, owned server, public server
- [x] 2.3 Create `app/Http/Controllers/DevEmitController.php` — POST /dev/emit publishes to Redis `events` channel
- [x] 2.4 Add `POST /dev/emit` route to `routes/web.php` (guarded by `APP_ENV=local|testing`, 404 otherwise)
- [x] 2.5 Verify: `php artisan e2e:seed` exits 0; `POST /dev/emit` returns 200 with Redis running

## Phase 3: Test Helpers (PR 1)

- [x] 3.1 Create `e2e/helpers/auth.js` — `login(page)` fills `/dev-login`, waits for `/chat`
- [x] 3.2 Create `e2e/helpers/redis.js` — `isRedisAvailable()` via HTTP ping to `localhost:8000/dev/ping`

## Phase 4: E2E Spec Files (PR 2)

- [x] 4.1 Create `e2e/login-page.spec.js` — render OAuth links and branding on `/login`
- [x] 4.2 Create `e2e/oauth-redirect.spec.js` — click Google → assert redirect to Google accounts URL
- [x] 4.3 Create `e2e/server-list.spec.js` — authenticated sidebar and DM section visible on `/chat`
- [x] 4.4 Create `e2e/socket-io.spec.js` — `test.skip()` when Redis unavailable

## Phase 5: Config & Full Verify (PR 2)

- [x] 5.1 Update `openspec/config.yaml` — set `testing.backend.e2e.available: true` and `testing.frontend.e2e.available: true`
- [x] 5.2 Full run: `php artisan e2e:seed && npm run test:e2e` — all pass on desktop viewport
- [x] 5.3 Regression: `php artisan test` (PHPUnit) and `npm test` (Vitest) remain green
- [x] 5.4 Verify Socket.io test skips (not fails) when Redis is stopped
- [x] 5.5 Verify `test-results/` captures screenshots+trace on intentional failure
