# Charlando-ando

Discord-like real-time chat platform — Laravel 13 + Inertia.js + React + Socket.io sidecar.

## Stack

| Layer | Technology |
| --- | --- |
| Backend | Laravel 13 (PHP 8.4) |
| Real-time | Socket.io 4 (Node.js 22 sidecar via Redis pub/sub) |
| Auth | Laravel Socialite — Google OAuth |
| Frontend | Inertia.js 2 + React 19 + Tailwind CSS 4 |
| State | Zustand (PR4) |
| Database | MySQL 8 |
| Local dev | Laravel Sail (Docker Compose) |

## Local development

```bash
# Bring up the full stack: Laravel, MySQL, Redis, Socket.io sidecar
./vendor/bin/sail up -d

# Install PHP + JS dependencies
./vendor/bin/sail composer install
./vendor/bin/sail npm install

# Run migrations + seed permission lookup
./vendor/bin/sail artisan migrate --seed

# Build/watch the frontend
./vendor/bin/sail npm run dev
```

The Socket.io sidecar exposes a `/health` endpoint on port 3000 in this PR.
Full pub/sub bridge, JWT verification, and presence tracking land in PR3.

## Architecture

```
React  --HTTP-->  Laravel  --Redis publish-->  Socket.io sidecar  --WebSocket-->  React
                                                       |
                                                       +-- Redis SETEX presence (PR3)
```

Inertia serves the React SPA from the same Laravel process. Pages live in
`resources/js/pages/` and are loaded lazily by `resources/js/app.jsx`.

## Data model

- `users` (extended with `provider`, `provider_id`, `display_name`, `status`, `last_seen_at`)
- `servers`, `channels`, `server_members`, `roles`, `permissions`, `role_permission`
- `messages` (polymorphic — belongs to a channel or a direct-message thread)
- `direct_messages` (unique pair via `LEAST`/`GREATEST` functional index on MySQL)
- `channel_overrides`, `channel_override_permission` (per-channel allow/deny matrix)
- `invites` (single- or multi-use, with optional expiry)

## Phases

This repo is being built in chained PRs. Current state: **PR1 — Foundation**.

- [x] **PR1** — Foundation: Laravel scaffold, MySQL/Redis/Socket.io compose, 12 migrations, 10 models, Inertia + React + Tailwind + Deep Space theme.
- [ ] **PR2** — Auth + Core Backend (Socialite, JWT, Server/Channel/Message controllers, PermissionResolver, InviteService).
- [ ] **PR3** — Real-time Infrastructure (Socket.io server.js, presence, event broadcasting).
- [ ] **PR4** — Frontend (Zustand store, chat pages, infinite scroll, DM pages, settings).
- [ ] **PR5** — Testing + E2E (PHPUnit feature/unit + manual smoke).
