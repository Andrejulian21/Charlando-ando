# e2e-testing Specification

## Purpose

Automated end-to-end smoke tests using Playwright to guard critical user journeys: OAuth login, authenticated navigation, and real-time messaging. Replaces the current manual-only E2E checklist.

## Requirements

### Requirement: Playwright Test Runner Configuration

The project MUST provide a `playwright.config.js` that auto-starts the Laravel dev server and defines viewport projects for desktop and mobile coverage.

The configuration MUST define:
- `baseURL`: `http://localhost:8000`
- `webServer.command`: `php artisan serve --port=8000`
- `webServer.reuseExistingServer`: `true` (do NOT start if port 8000 is already in use)
- Two projects: `Desktop Chrome` (viewport 1280×720) and `Mobile Safari` (viewport 390×844)
- Test directory: `./e2e`
- Timeout: 30s per test, 120s global

#### Scenario: Playwright launches dev server automatically

- GIVEN no process is listening on port 8000
- WHEN `npx playwright test` is invoked
- THEN `php artisan serve --port=8000` starts before any test runs
- AND Playwright waits for the server to respond to `http://localhost:8000`

#### Scenario: Playwright reuses existing server

- GIVEN a Laravel dev server is already running on port 8000
- WHEN `npx playwright test` is invoked
- THEN Playwright does NOT start a second server
- AND tests run against the existing instance

#### Scenario: Both viewport projects run all tests

- GIVEN the configuration defines Desktop Chrome and Mobile Safari projects
- WHEN `npx playwright test` completes
- THEN every spec file runs once per project (2× coverage)

---

### Requirement: Login Page Smoke Test

The system MUST verify that the login page (`/login`) renders all essential auth UI elements and OAuth provider links point to the correct redirect paths.

#### Scenario: Login page renders with OAuth providers

- GIVEN an unauthenticated browser navigates to `/login`
- WHEN the page finishes loading
- THEN the heading "Bienvenido de vuelta" is visible
- AND a link with text "Continuar con Google" is present
- AND the Google link `href` attribute ends with `/auth/google/redirect`
- AND a link with text "Continuar con GitHub" is present
- AND the GitHub link `href` attribute ends with `/auth/github/redirect`

#### Scenario: Login page renders app branding

- GIVEN an unauthenticated browser navigates to `/login`
- WHEN the page finishes loading
- THEN the app logo `<img>` with `alt="Charlando-ando"` is visible
- AND the support email link points to `mailto:soporte@charlando.app`

#### Scenario: Error state displays OAuth failure message

- GIVEN the login page receives an `errors.oauth` prop via Inertia (simulated by navigating to `/login?error=oauth_failed` if supported, or by direct page manipulation)
- WHEN the page renders
- THEN a `role="alert"` element containing the error text is visible
- AND the OAuth provider buttons are still present (errors are non-blocking)

---

### Requirement: Google OAuth Redirect Smoke Test

The system MUST verify that clicking "Continuar con Google" initiates the correct OAuth flow by navigating to the server-side redirect endpoint.

#### Scenario: Google OAuth button navigates to redirect endpoint

- GIVEN an unauthenticated browser is on `/login`
- WHEN the user clicks "Continuar con Google"
- THEN the browser navigates to a URL ending with `/auth/google/redirect`
- AND the response is a redirect to Google's OAuth consent screen (status 302 or URL contains `accounts.google.com`)

#### Scenario: GitHub OAuth button navigates to redirect endpoint

- GIVEN an unauthenticated browser is on `/login`
- WHEN the user clicks "Continuar con GitHub"
- THEN the browser navigates to a URL ending with `/auth/github/redirect`
- AND the response is a redirect to GitHub's OAuth authorize URL (status 302 or URL contains `github.com/login/oauth`)

---

### Requirement: Authenticated Server List Smoke Test

The system MUST verify that an authenticated user can see their joined servers and available public servers on the `/chat` page.

#### Scenario: Authenticated user sees server list on /chat

- GIVEN an authenticated user with at least one joined server
- WHEN the browser navigates to `/chat`
- THEN the server sidebar (ServerSidebar component) is visible in the DOM
- AND at least one server name is rendered in the sidebar
- AND the `<h1>` or page title is "Chat"

#### Scenario: Authenticated user sees public server discovery

- GIVEN an authenticated user is on `/chat`
- AND at least one public server exists that the user has NOT joined
- WHEN the page renders the public servers panel
- THEN a heading "Servidores públicos disponibles" is visible
- AND at least one "Unirse" (Join) button is present
- AND each public server card shows the server name and owner name

#### Scenario: Unauthenticated user is redirected from /chat

- GIVEN a browser with no auth cookie or token
- WHEN navigating directly to `/chat`
- THEN the browser is redirected to `/login`
- AND the login page renders successfully

---

### Requirement: Socket.io Message Flow Smoke Test

The system MUST verify that an authenticated client can connect to the Socket.io sidecar and exchange messages through the real-time pipeline.

**Prerequisite**: Redis server MUST be running. The Socket.io sidecar MUST be listening on port 3000. If Redis is unavailable, this test SHOULD be skipped with a clear log message.

#### Scenario: Socket.io client connects with JWT

- GIVEN a valid JWT token is stored in `localStorage` under key `auth_token`
- WHEN the client calls `connect()` from `echo.js`
- THEN a WebSocket connection to `http://localhost:3000` is established
- AND the `socket.connected` property is `true`
- AND no `connect_error` event is fired

#### Scenario: Subscribing to a room receives broadcast messages

- GIVEN a connected and authenticated Socket.io client
- AND the client subscribes to room `channel:1` for event `message:new`
- WHEN the server-side emits `message:new` with payload `{ body: "Hola" }` to room `channel:1`
- THEN the registered callback fires within 2 seconds
- AND the callback receives the payload `{ body: "Hola" }`

#### Scenario: Unsubscribe stops receiving messages

- GIVEN a client subscribed to `channel:1` for `message:new`
- WHEN the client calls the unsubscribe function returned by `subscribe()`
- AND the server emits another `message:new` to `channel:1`
- THEN the original callback does NOT fire

#### Scenario: Invalid room name throws immediately

- GIVEN a connected Socket.io client
- WHEN calling `subscribe("bad-room-format", "message:new", () => {})`
- THEN an error is thrown with message matching `/invalid room/`

---

### Requirement: NPM Test Script

The project MUST provide an `npm run test:e2e` script that invokes Playwright with the project config.

#### Scenario: test:e2e runs Playwright

- GIVEN `@playwright/test` is installed as a devDependency
- AND `playwright.config.js` exists at the project root
- WHEN `npm run test:e2e` is executed
- THEN Playwright runs all spec files in `./e2e/`
- AND the exit code is 0 when all tests pass
- AND the exit code is non-zero when any test fails

---

## Non-Functional Requirements

| ID  | Requirement | Strength |
|-----|------------|----------|
| NFR-1 | Tests MUST complete in under 120 seconds total (global timeout) | MUST |
| NFR-2 | Tests MUST be idempotent — running twice yields the same result | MUST |
| NFR-3 | Tests MUST NOT mutate production data (use `.env.testing` with `DB_DATABASE=testing` and SQLite in-memory) | MUST |
| NFR-4 | Socket.io tests SHOULD auto-skip with `test.skip()` when Redis is unreachable | SHOULD |
| NFR-5 | Test failures MUST produce screenshots and traces in `test-results/` | MUST |
| NFR-6 | Tests MUST NOT depend on external OAuth providers (assert URL patterns, not full token exchange) | MUST |
| NFR-7 | Spanish UI text assertions MUST match actual rendered strings (e.g., "Bienvenido de vuelta", not "Welcome back") | MUST |

---

## Acceptance Criteria

- [ ] `npm run test:e2e` exits with code 0 when Redis is running and a test database is seeded
- [ ] All four spec files pass on both Desktop Chrome AND Mobile Safari viewports
- [ ] Existing `npm test` (Vitest) and `php artisan test` (PHPUnit) suites pass without regression
- [ ] `playwright.config.js` does NOT hardcode secrets or absolute paths
- [ ] Socket.io test produces `SKIPPED` (not FAILED) when Redis is unavailable
- [ ] Test failures produce artifacts in `test-results/` directory listed in `.gitignore`

---

## Test Data Requirements

| Data | Purpose | Seeding Strategy |
|------|---------|-----------------|
| Test user with JWT | Authenticated tests (server list, socket) | Laravel factory or direct DB insert in `tests/` bootstrap; store JWT in `localStorage` via `page.evaluate()` before navigating |
| At least one joined server | Server list smoke test | Seed `servers` and `server_user` pivot table via migration or factory |
| At least one public server (not joined) | Public server discovery | Seed a server with `is_public = true` and owner ID different from test user |
| Redis running | Socket.io sidecar bridge | Document prerequisite; test auto-skips if `redis://localhost:6379` is unreachable |
