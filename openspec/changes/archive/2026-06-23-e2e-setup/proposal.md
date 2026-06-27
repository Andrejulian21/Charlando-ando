# Proposal: E2E Test Setup with Playwright

## Intent

Add automated end-to-end testing to Charlando-ando using Playwright. Currently E2E is manual only (openspec/config.yaml). This creates a repeatable safety net for critical user journeys: auth, server browsing, and real-time messaging.

## Scope

### In Scope
- Install `@playwright/test` and configure `playwright.config.js`
- WebServer auto-start via `php artisan serve --port=8000`
- Desktop + mobile viewport projects
- Smoke tests: login page render, Google OAuth redirect, authenticated server list load, Socket.io message flow
- Add `test:e2e` script to `package.json`

### Out of Scope
- Full test coverage expansion (only smoke tests)
- CI/CD pipeline integration (local run only)
- Visual regression or performance testing
- OAuth mock/stub infrastructure (deferred)

## Capabilities

### New Capabilities
- `e2e-testing`: Playwright-based E2E suite covering auth and real-time critical paths

### Modified Capabilities
- None

## Approach

1. Install Playwright and browsers (`npm init playwright@latest`)
2. Write `playwright.config.js` with baseURL `http://localhost:8000`, `webServer` command, and two projects (Desktop Chrome, Mobile Safari)
3. Seed minimal test data via Laravel factories or SQLite migration state
4. Write four `.spec.js` smoke tests in `e2e/` directory
5. Add `test:e2e` to `package.json` scripts

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Modified | Add `@playwright/test` devDependency and `test:e2e` script |
| `playwright.config.js` | New | Playwright configuration with webServer and viewports |
| `e2e/` | New | Smoke test files for auth and messaging flows |
| `.env.testing` | Modified | Ensure `DB_DATABASE=testing` and `APP_URL=http://localhost:8000` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Flaky Socket.io tests | Med | Use `page.waitForEvent`, explicit DOM assertions |
| OAuth redirect instability | Med | Assert URL pattern, not full token exchange |
| Port 8000 conflict | Low | Allow Playwright to retry or use env override |
| Redis not running during tests | Med | Document prerequisite; skip Socket.io test if unavailable |

## Rollback Plan

1. Remove `@playwright/test` from `package.json` and reinstall
2. Delete `playwright.config.js` and `e2e/` directory
3. Revert any `.env.testing` changes

## Dependencies

- Node.js 18+
- Redis server running (for Socket.io sidecar)

## Success Criteria

- [ ] `npm run test:e2e` passes all four smoke tests locally
- [ ] Existing PHPUnit and Vitest suites remain green
- [ ] Tests run against both desktop and mobile viewports

## Effort Estimate

~4–6 hours (single session).
