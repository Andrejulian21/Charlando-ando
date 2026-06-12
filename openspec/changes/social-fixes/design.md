# Design: social-fixes

## Technical Approach

Layer-based implementation: backend config first (OAuth env vars), then backend API (user search + DM creation), then frontend (sidebar nav + search modal). Each layer is independently testable and deployable.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|---|---|---|---|
| OAuth env vars | Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` to `.env` | Hardcode in config | Follows existing Laravel pattern; `config/services.php` already reads them. |
| Google redirect prompt | `->with(['prompt' => 'select_account'])` for Google driver only | Global parameter for all providers | Forces account selection on every Google login, fixing the "auto-login to wrong account" bug. |
| User search | Single endpoint `GET /api/users/search?q=term` with `LIKE` on `name`, `display_name`, `email` | Full-text search (e.g., Scout) | Fast to implement, sufficient for small user bases; no extra indexing needed. |
| DM thread uniqueness | `findBetween` + `DB::transaction` create | Unique DB index | `findBetween` already exists; transaction prevents race-condition duplicates without schema changes. |
| DM response shape | Eager-load `userA` and `userB`, return the other participant | Return only DM ids | Spec requires participant info in the response; eager-loading avoids N+1. |
| Frontend sidebar | Add DM icon above server list (Discord pattern) | Separate DM tab or modal | Minimal layout change; aligns with existing vertical strip design. |
| User search modal | Dedicated `UserSearchModal` component | Inline search in sidebar | Modal keeps sidebar simple and reuses search results for both new and existing DMs. |

## Data Flow

### OAuth Login Flow

```
User clicks "Sign in with Google"
  → OAuthController::redirect('google')
    → Socialite::driver('google')->with(['prompt' => 'select_account'])->redirect()
      → Google OAuth consent screen
        → callback → OAuthController::callback
          → session stash → redirect to /auth/callback
            → Callback.jsx stores token → /chat
```

### User Search Flow

```
User opens UserSearchModal → types "mar"
  → GET /api/users/search?q=mar
    → UserController::search()
      → User::where(...LIKE...)->limit(20)->get()
        → JSON [{id, name, display_name, avatar_url, dm_exists}]
  → UserSearchModal renders list
```

### DM Creation Flow

```
User clicks search result (user_id: 7)
  → POST /api/dms {user_id: 7}
    → DirectMessageController::createThread()
      → DirectMessage::findBetween(authId, 7)
        → if found: return existing DM
        → else: DB::transaction create DM with user_a_id / user_b_id
      → response includes DM + other user
  → frontend navigates to /dms/{dm.id}
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `.env` | Modify | Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| `config/services.php` | Verify | Already reads env vars; no change needed |
| `app/Http/Controllers/Auth/OAuthController.php` | Modify | Add `->with(['prompt' => 'select_account'])` for Google driver |
| `app/Http/Controllers/UserController.php` | Modify | Add `search(Request)` method |
| `app/Http/Controllers/Messages/DirectMessageController.php` | Modify | Add `createThread(Request)` method |
| `app/Models/DirectMessage.php` | Modify | Add `firstOrCreateBetween(int, int)` transaction wrapper |
| `routes/api.php` | Modify | Add `GET users/search` and `POST dms` routes |
| `resources/js/components/Chat/ServerSidebar.jsx` | Modify | Add DM navigation button above server list |
| `resources/js/components/Chat/UserSearchModal.jsx` | **Create** | Search users, show results, start/navigate to DM |
| `resources/js/pages/Auth/Callback.jsx` | Verify | No changes expected; token flow remains identical |

## Interfaces / Contracts

```php
// UserController::search
public function search(Request $request): JsonResponse;

// DirectMessageController::createThread
public function createThread(Request $request): JsonResponse;

// DirectMessage::firstOrCreateBetween
public static function firstOrCreateBetween(int $userIdA, int $userIdB): self;
```

User search response fragment:
```json
{
  "data": [
    { "id": 7, "name": "maria", "display_name": "María", "avatar_url": "...", "dm_exists": true }
  ]
}
```

DM creation response fragment:
```json
{
  "data": {
    "id": 5,
    "user_a_id": 1,
    "user_b_id": 7,
    "other_user": { "id": 7, "name": "maria", "display_name": "María", "avatar_url": "..." },
    "last_message_at": null
  }
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `DirectMessage::firstOrCreateBetween` | PHPUnit model test: assert no duplicates, correct ordering |
| Feature | `GET /api/users/search` | Feature test: auth gate, exclusion of self, empty query, result limit |
| Feature | `POST /api/dms` | Feature test: creates thread, returns existing, 403/401 guards, response shape |
| Frontend | `UserSearchModal`, `ServerSidebar` | **No JS test framework installed** — manual QA; add framework later |

## Migration / Rollout

No database migration required. Before deploying, add the three Google OAuth env vars to the production `.env`. The `prompt=select_account` change is immediate and backward-compatible.

## Open Questions

- [ ] Should `dm_exists` in search results be computed via a single `WHERE IN` subquery or per-row check? (Performance vs simplicity)
- [ ] Should the DM creation endpoint return the full `DirectMessage` resource with messages hydrated, or just the thread header? (Spec says header only)
- [ ] Is a JS test framework (e.g., Vitest) planned soon, or should we accept manual QA risk for this change?
