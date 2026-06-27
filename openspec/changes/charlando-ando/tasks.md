# Tasks: charlando-ando — Hotfix Batch + PR5 Testing

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~450 (hotfix ~150 + PR5 tests ~300) |
| 400-line budget risk | Medium |
| Chained PRs recommended | No (split: hotfix commit batch + PR5 branch) |
| Suggested split | Hotfix batch (tracker) → PR5 (feature/pr5-tests) |
| Delivery strategy | feature-branch-chain |
| Chain strategy | feature-branch-chain (tracker: `feature/charlando-ando`) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: feature-branch-chain
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| Hotfix | Fix auth, remove Discord, Spanish UI, design polish, type fix | Direct to tracker | ~150 lines, 5 commits |
| PR5 | PHPUnit tests + manual E2E verification | `feature/pr5-tests` → tracker | ~300 lines, 5 test files |

---

## Hotfix Batch (In Progress — direct to `feature/charlando-ando`)

### HF-1: Fix DevLoginController environment guard ✅ DONE
- **Status**: Already applied — `ensureLocalEnvironment()` present in all 4 public methods
- **Files**: `app/Http/Controllers/Auth/DevLoginController.php`
- **Verify**: `GET /dev-login` returns 404 when `APP_ENV=production`

### HF-2: Remove Discord OAuth 🔄 IN PROGRESS
- **What**: Remove `'discord'` from `OAuthController::ALLOWED_PROVIDERS`
- **Files**: `app/Http/Controllers/Auth/OAuthController.php` (line 26)
- **Accept**: `ALLOWED_PROVIDERS = ['google', 'github']`; Login.jsx has no Discord button (already clean)
- **Effort**: S

### HF-3: Spanish UI Audit 🔄 IN PROGRESS
- **What**: All user-facing text in React pages/components must be neutral/professional Spanish
- **Files**: All `resources/js/pages/**/*.jsx` and `resources/js/components/**/*.jsx`
- **Accept**: No English strings visible to users (labels, buttons, placeholders, errors, headings)
- **Effort**: M (multiple pages to audit)

### HF-4: Design Polish 🔄 IN PROGRESS
- **What**: Glass-morphism on cards, tighter heading tracking (`tracking-tight`), better shadows, personality
- **Files**: `resources/css/app.css` (tokens), all page JSX (card classes)
- **Accept**: Cards use `backdrop-blur` + semi-transparent bg; headings use `tracking-tight`; shadows use `shadow-primary/20` tint
- **Effort**: M

### HF-5: Fix OAuth callback route type collision ✅ DONE
- **Status**: Already applied — `OAuthController` uses `RedirectResponse` for redirect methods
- **Files**: `app/Http/Controllers/Auth/OAuthController.php`
- **Verify**: `php artisan route:list` shows no type errors

---

## Phase 5: Testing + Integration (PR5 — `feature/pr5-tests`)

### 5.1 PermissionResolverTest — Unit (effort: M)
- **File**: `tests/Unit/PermissionResolverTest.php`
- **Runner**: `php artisan test --filter=PermissionResolverTest`
- **Dependencies**: None (pure unit test, mocks DB via RefreshDatabase)
- **Cases**:
  - [ ] `server_level_allow`: role has `send_messages` → `canInServer()` returns true
  - [ ] `server_level_deny`: role lacks `manage_channels` → returns false
  - [ ] `channel_deny_precedence`: role has `send_messages` at server level, channel override denies → returns false
  - [ ] `channel_allow_grants_new`: role lacks `attach_files` at server level, channel override allows → returns true
  - [ ] `non_member_rejected`: user not in `server_members` → returns false for any permission
  - [ ] `role_hierarchy`: owner (level=100) has more perms than member (level=40)
- **Accept**: 6 test methods, all green. Uses `RefreshDatabase` + model factories

### 5.2 InviteTest — Feature (effort: L)
- **File**: `tests/Feature/InviteTest.php`
- **Runner**: `php artisan test --filter=InviteTest`
- **Dependencies**: 5.1 (uses PermissionResolver for setup), InviteService, ServerMember model
- **Cases**:
  - [ ] `valid_invite_creates_member`: redeem valid code → `server_members` row created, `uses` incremented
  - [ ] `single_use_exhausted`: invite with `max_uses=1`, redeem twice → second throws `InvalidInviteException::exhausted()`
  - [ ] `expired_invite_rejected`: invite with `expires_at` in past → throws `InvalidInviteException::expired()`
  - [ ] `invalid_code_rejected`: random code → throws `InvalidInviteException('Invite code not found.')`
  - [ ] `concurrent_redemption_race`: two parallel `redeem()` calls on same single-use invite → one succeeds, one throws. Use `DB::transaction` + `lockForUpdate()` (already in InviteService)
- **Accept**: 5 test methods. Concurrency test uses `pcntl_fork` or two sequential transactions to simulate race

### 5.3 OAuthTest — Feature (effort: M)
- **File**: `tests/Feature/OAuthTest.php`
- **Runner**: `php artisan test --filter=OAuthTest`
- **Dependencies**: OAuthController, JwtService, Socialite (mock)
- **Cases**:
  - [ ] `callback_creates_new_user`: mock Socialite → user with provider+provider_id created, session has `oauth_result` with JWT
  - [ ] `callback_dedup_by_email`: existing user with same email, null provider → provider/provider_id linked, no new row
  - [ ] `callback_returns_jwt_in_session`: after callback, `session('oauth_result.token')` is non-empty string, `JwtService::verify()` returns the user
  - [ ] `callback_invalid_provider_404`: `GET /auth/discord/redirect` → 404 (after HF-2 removes Discord)
  - [ ] `callback_page_without_session_redirects`: `GET /auth/callback` with no `oauth_result` in session → redirect to `/login`
- **Accept**: 5 test methods. Socialite mocked via `Socialite::shouldReceive()->mock()`

### 5.4 MessageTest — Feature (effort: M)
- **File**: `tests/Feature/MessageTest.php`
- **Runner**: `php artisan test --filter=MessageTest`
- **Dependencies**: MessageController, Server/Channel/Message factories, authenticated user
- **Cases**:
  - [ ] `cursor_pagination_desc_order`: create 60 messages, `GET /api/servers/{s}/channels/{c}/messages` → first 50 returned, `next_cursor` non-null
  - [ ] `cursor_pagination_second_page`: pass `?cursor={50th_id}` → returns remaining 10, `next_cursor` is null (stop signal)
  - [ ] `empty_history_stop_signal`: empty channel → `data: []`, `next_cursor: null`
  - [ ] `concurrent_inserts_stability`: 10 rapid `POST` calls → all 10 persisted, no duplicates, IDs monotonically increasing
  - [ ] `non_member_gets_403`: authenticated user not in server → `POST` returns 403
- **Accept**: 5 test methods. Uses `actingAs()` for auth. `MessageSent` event faked via `Event::fake()`

### 5.5 Manual E2E Verification (effort: S)
- **File**: No automated file — manual checklist
- **Dependencies**: All above tests green, Socket.io sidecar running
- **Steps**:
  - [ ] `sail up -d` → all containers healthy (MySQL, Redis, Socket.io, app)
  - [ ] `GET /login` → Login page renders in Spanish
  - [ ] Google OAuth login → redirects to `/auth/callback` → lands on `/chat`
  - [ ] Create server (name: "Test Server") → auto-creates "general" channel
  - [ ] Send message "Hola mundo" → appears in MessageList
  - [ ] Open second browser tab, same channel → message appears in real-time via Socket.io
  - [ ] Send message from tab 2 → appears in tab 1 in real-time
- **Accept**: All 7 steps pass. Screenshot or screen recording as evidence

---

## Test Infrastructure Prerequisite

### 5.0 Test Setup (effort: S)
- **What**: Ensure PHPUnit config, test database, and model factories exist
- **Files**: `phpunit.xml` (SQLite test DB), `database/factories/` (User, Server, Channel, Message, Role, Invite factories)
- **Accept**: `php artisan test` runs with 0 errors on empty suite; all factories create valid models
- **Runner**: `php artisan test`

---

## Implementation Order

```
HF-2 → HF-3 → HF-4          (hotfix batch, commit to tracker)
   ↓
5.0 Test Setup               (factories + phpunit.xml)
   ↓
5.1 PermissionResolverTest   (unit, no deps)
   ↓
5.3 OAuthTest                (feature, independent)
5.4 MessageTest              (feature, independent — parallel with 5.3)
   ↓
5.2 InviteTest               (feature, uses factories from 5.0)
   ↓
5.5 Manual E2E               (requires all above green + sidecar running)
```

## PR5 Branch Strategy

- **Branch**: `feature/pr5-tests` cut from `feature/charlando-ando` (after hotfix merge)
- **Target**: PR merges back into `feature/charlando-ando`
- **Review budget**: ~300 LOC (test files only, well within 400-line limit)
