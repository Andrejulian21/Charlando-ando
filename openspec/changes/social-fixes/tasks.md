# Tasks: Social Fixes — OAuth, User Search & Direct Messages

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 250–300 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: OAuth Fix (Config + Backend)

- [x] 1.1 Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` to `.env`
- [x] 1.2 Add `->with(['prompt' => 'select_account'])` to Google Socialite redirect in `OAuthController.php`
- [x] 1.3 Verify `config/services.php` reads `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` from env

## Phase 2: Backend APIs (User Search + DM Creation)

- [x] 2.1 Add `search(Request)` to `UserController` — `LIKE` on name/display_name/email, exclude self, limit 20, `dm_exists`
- [x] 2.2 Add `GET /api/users/search` route in `routes/api.php`
- [x] 2.3 Add `firstOrCreateBetween(int, int)` transaction helper to `DirectMessage` model
- [x] 2.4 Add `createThread(Request)` to `DirectMessageController` — find-or-create via helper, eager-load participant
- [x] 2.5 Add `POST /api/dms` route in `routes/api.php`

## Phase 3: Frontend (Sidebar + Search Modal + Routing)

- [x] 3.1 Add DM navigation button to `ServerSidebar.jsx` above server list
- [x] 3.2 Create `UserSearchModal.jsx` — search input, debounced call, results list with `dm_exists`
- [x] 3.3 Wire click on result: POST `/api/dms`, navigate to `/dms/{dm.id}` on success
- [x] 3.4 Verify `Callback.jsx` does not force auto-server redirect before token loads

## Phase 4: Testing

- [x] 4.1 Feature test: `GET /api/users/search` — auth gate, self-exclusion, empty query, result shape, `dm_exists`
- [x] 4.2 Feature test: `POST /api/dms` — creates new thread, returns existing, 401/403 guards, response shape
