# Design: E2E Test Setup with Playwright

## Technical Approach

Add Playwright as a local-only E2E harness that boots `php artisan serve` against a dedicated SQLite file, seeds deterministic test data via a custom Artisan command, and authenticates through the existing `/dev-login` flow (session-based for web pages, JWT via localStorage for Socket.io). Four spec files cover login render, OAuth redirect URL patterns, authenticated server list, and real-time message flow. Socket.io tests auto-skip when Redis is unreachable.

## Architecture Decisions

| Decision | Options | Choice | Rationale |
|----------|---------|--------|-----------|
| Auth strategy for web tests | OAuth mock / session cookie injection / dev-login form | **Dev-login form** | `/dev-login` already exists for `APP_ENV=local`, exercises the real session pipeline, no mocks needed. POST email+password → session cookie + JWT in localStorage. |
| Auth strategy for Socket.io tests | Extract JWT from session / dedicated dev endpoint / generate in Node | **JWT from localStorage after dev-login** | Dev-login already stores JWT via the `oauth_result` → `/auth/callback` → `localStorage` pipeline. Reuses production code path. |
| Test database | In-memory SQLite / file-based SQLite / MySQL | **File-based SQLite** (`database/testing.sqlite`) | `artisan serve` is a long-running process; in-memory DB dies between requests. File persists across the test run, resets via `e2e:seed`. |
| Data seeding | API calls / Artisan command / HTTP seed endpoint | **`php artisan e2e:seed` command** | Runs server-side with full factory access. Idempotent (drops + recreates). No auth chicken-and-egg problem. |
| Socket.io broadcast trigger | Direct Redis publish from Node / Laravel dev endpoint / mock | **Laravel dev-only route `POST /dev/emit`** | Publishes a Redis envelope matching the sidecar's expected format. Keeps test logic in Playwright; trigger is one HTTP call. Skipped when Redis is down. |
| Server env for tests | Same `.env` / `--env=testing` with `.env.testing` | **`--env=testing`** | Isolates test config (DB path, APP_KEY) from dev. Mirrors PHPUnit's `APP_ENV=testing` convention. |

## Data Flow

### Auth flow (web tests)
```
Playwright ──POST /dev-login──→ Laravel (session auth)
                                    │
                                    ├─ Auth::login($user)  → session cookie
                                    └─ JWT → session['oauth_result']
                                              │
Playwright ←── redirect /auth/callback ───────┘
    │
    └─ page.evaluate() → localStorage.setItem('auth_token', jwt)
```

### Socket.io message flow (realtime tests)
```
Playwright                    Socket.io sidecar          Redis
    │                              │                      │
    ├─ connect(token) ────────────→│ verify JWT ──→ ok    │
    ├─ subscribe('channel:1') ────→│ socket.join(room)    │
    │                              │                      │
    ├─ POST /dev/emit ──→ Laravel ─┼─ PUBLISH events ────→│
    │   {event,room,data}          │                      │
    │                              │◄── message event ────┤
    │◄──── socket 'message:new' ───┤                      │
    │                              │                      │
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `playwright.config.js` | Create | Playwright config: baseURL, webServer, Desktop Chrome + Mobile Safari projects, timeouts, screenshot/trace on failure |
| `e2e/auth/login.spec.js` | Create | Login page render: heading, OAuth links, branding, error state |
| `e2e/auth/oauth-redirect.spec.js` | Create | Click Google/GitHub buttons → assert redirect URL pattern |
| `e2e/chat/server-list.spec.js` | Create | Authenticated `/chat`: server sidebar, public discovery, unauth redirect |
| `e2e/realtime/socket-io.spec.js` | Create | Socket connect, subscribe/receive, unsubscribe, invalid room. Auto-skip if Redis down |
| `e2e/helpers/auth.js` | Create | `login(page)` helper: fills dev-login form, waits for `/chat`, stores JWT |
| `e2e/helpers/redis.js` | Create | `isRedisAvailable()` check — attempts TCP connect to `localhost:6379` |
| `app/Console/Commands/E2eSeedCommand.php` | Create | `e2e:seed` Artisan command: creates test user, joined server, public server |
| `database/seeders/E2eSeeder.php` | Create | Seeder class called by the command (keeps logic testable) |
| `app/Http/Controllers/Dev/EmitController.php` | Create | Dev-only `POST /dev/emit` — publishes Redis envelope for Socket.io tests |
| `routes/web.php` | Modify | Add `POST /dev/emit` route (local-only guard) |
| `package.json` | Modify | Add `@playwright/test` devDep, `test:e2e` script |
| `.env.testing` | Create | `APP_ENV=testing`, `DB_CONNECTION=sqlite`, `DB_DATABASE=database/testing.sqlite`, `APP_KEY` (copy from `.env`) |
| `.gitignore` | Modify | Add `test-results/`, `playwright-report/`, `database/testing.sqlite` |

## Interfaces / Contracts

### `playwright.config.js` structure
```js
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  globalTimeout: 120_000,
  use: {
    baseURL: 'http://localhost:8000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'php artisan serve --port=8000 --env=testing',
    reuseExistingServer: true,
    timeout: 15_000,
  },
  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 13'] } },
  ],
});
```

### `e2e:seed` command contract
```
php artisan e2e:seed
```
- Resets `database/testing.sqlite` (runs `migrate:fresh --env=testing`)
- Creates user: `test@charlando.app` / `password` (name: "Test User")
- Creates server "Servidor Test" owned by another user, `is_public: true` (for public discovery)
- Creates server "Mi Servidor" owned by test user, with test user as member (for joined list)
- Outputs created IDs for debugging

### `POST /dev/emit` contract
```
POST /dev/emit
Content-Type: application/json
{
  "event": "message:new",
  "room": "channel:1",
  "data": { "body": "Hola" }
}
```
- Guarded by `APP_ENV=local` (404 otherwise)
- Publishes JSON envelope to Redis `events` channel
- Returns `200 { "ok": true }` or `503` if Redis unavailable

### `e2e/helpers/auth.js`
```js
export async function login(page) {
  await page.goto('/dev-login');
  await page.fill('input[name="email"]', 'test@charlando.app');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/chat');
}
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Login render | Heading, OAuth links, branding, error state | Static assertions on `/login` DOM. No auth needed. |
| OAuth redirect | URL pattern after clicking provider buttons | `page.waitForURL()` with regex. No full OAuth exchange. |
| Server list | Sidebar, public discovery, unauth redirect | `login()` helper → navigate `/chat` → assert Inertia props rendered. |
| Socket.io | Connect, subscribe, receive, unsubscribe, invalid room | `page.evaluate()` to call echo.js exports. `test.skip()` if Redis down. |

### Verification steps
1. `npm install` — installs `@playwright/test`
2. `npx playwright install chromium` — installs browser binaries
3. `php artisan e2e:seed` — seeds test database
4. `npm run test:e2e` — runs all specs, expects exit 0
5. Verify `test-results/` contains artifacts on intentional failure
6. Verify Socket.io test shows `SKIPPED` when Redis is stopped
7. Verify `php artisan test` and `npm test` still pass (no regression)

## Migration / Rollout

No data migration. This is additive — new files only, plus two new routes guarded by `APP_ENV=local`.

**Rollback**: Remove `@playwright/test` from `package.json`, delete `playwright.config.js`, `e2e/`, `app/Console/Commands/E2eSeedCommand.php`, `database/seeders/E2eSeeder.php`, `app/Http/Controllers/Dev/EmitController.php`, revert `routes/web.php` and `.gitignore` changes, delete `.env.testing`.

## Open Questions

- [ ] Confirm `APP_KEY` in `.env.testing` should match `.env` (needed for JWT signature compatibility between Laravel and Socket.io sidecar)
- [ ] Whether `POST /dev/emit` should also accept a `delay_ms` parameter for testing race conditions (deferred — not in spec)
