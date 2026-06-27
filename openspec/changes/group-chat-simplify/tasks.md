# Tasks: Group Chat Simplify

## Review Workload Forecast
| Field | Value |
|-------|-------|
| Estimated changed lines | ~500 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |

## Tasks

### Phase 1: API Auth Fix
- [x] 1.1 Add session middleware to API routes (bootstrap/app.php)
- [x] 1.2 Share auth.user globally via Inertia::share (AppServiceProvider)
- [x] 1.3 Configure axios with withCredentials + withXSRFToken (app.jsx)
- [x] 1.4 Update fetch() calls to use axios (UserSearchModal, ServerCreateModal)

### Phase 2: Public/Private Servers
- [x] 2.1 Create migration for is_public column
- [x] 2.2 Add is_public to Server model fillable
- [x] 2.3 Update ServerController store() to accept is_public
- [x] 2.4 Update ServerController index() to return public servers separately
- [x] 2.5 Add ServerController join() method
- [x] 2.6 Add POST /api/servers/{server}/join route
- [x] 2.7 Update PageController to pass publicServers prop

### Phase 3: Logout
- [x] 3.1 Add POST /logout web route
- [x] 3.2 Add logout button with localStorage cleanup in UserBar

### Phase 4: Frontend
- [x] 4.1 Add public/private toggle to ServerCreateModal
- [x] 4.2 Show public servers list on Index page with join button
- [x] 4.3 Rebuild frontend assets

### Phase 5: Testing
- [x] 5.1 Set up Vitest + @testing-library/react + jsdom
- [x] 5.2 Write PresenceBadge component tests (8 tests)
- [x] 5.3 Write UserAvatar component tests (8 tests)
- [x] 5.4 Write ChatHeader component tests (5 tests)
- [x] 5.5 Write useChatStore tests (10 tests)
- [x] 5.6 GET /api/dms endpoint + tests (5 tests)
