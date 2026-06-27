# Design: Group Chat Simplify

## Problem
The original server/channel/role/permission system was overly complex for the app's needs. Users couldn't easily discover and join servers, and authentication for API calls was broken (session auth wasn't available on API routes).

## Decisions

### 1. API Route Authentication
- **Decision**: Load API routes with `web` middleware group instead of `api` group
- **Why**: The Inertia SPA uses session-based auth; API routes need session access
- **How**: Custom `withRouting(using: ...)` callback in `bootstrap/app.php`
- **Files**: `bootstrap/app.php`, `routes/api.php`

### 2. Shared Auth User
- **Decision**: Use `Inertia::share('auth.user', ...)` for global auth user prop
- **Why**: Without `HandleInertiaRequests` middleware (removed in Inertia v3), no page had access to the authenticated user
- **Files**: `app/Providers/AppServiceProvider.php`

### 3. Public/Private Servers
- **Decision**: Add `is_public` boolean to servers table
- **Why**: Simplify group discovery — public servers visible to all, private servers invite-only
- **Migration**: `add_is_public_to_servers_table`
- **Files**: `app/Http/Controllers/Servers/ServerController.php`, `app/Models/Server.php`

### 4. Server Join Flow
- **Decision**: POST `/api/servers/{server}/join` for public servers
- **Why**: One-click join without invitation flow
- **Files**: `routes/api.php`, `ServerController.php`

### 5. Axios for API Calls
- **Decision**: Use `window.axios` with `withCredentials: true` and `withXSRFToken: true`
- **Why**: Fetch() calls don't handle CSRF tokens automatically; axios with XSRF config does
- **Files**: `resources/js/app.jsx`, `UserSearchModal.jsx`, `ServerCreateModal.jsx`

### 6. Logout
- **Decision**: POST `/logout` route that invalidates session + clears localStorage
- **Files**: `routes/web.php`, `ChannelList.jsx` (UserBar)

### 7. Frontend Testing
- **Decision**: Vitest + @testing-library/react + jsdom
- **Why**: Zero JS test coverage existed; pure components are easy to test
- **Files**: `vite.config.js`, `package.json`, `setupTests.js`, 4 test files
