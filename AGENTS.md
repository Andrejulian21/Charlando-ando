# Agent Context — Charlando-ando

## Stack Overview

- **Framework**: Laravel 13 + Inertia.js v3
- **Frontend**: React 19, Tailwind CSS 4, Vite 7
- **Real-time**: Socket.io sidecar via Redis pub/sub
- **Auth**: Google OAuth + GitHub OAuth via Laravel Socialite
- **Database**: SQLite (local dev), Redis
- **Queue**: Database queue driver

## Architecture

Laravel MVC backend with Inertia SPA frontend. RESTful JSON API via `api.php`. Real-time events via Socket.io sidecar.

Frontend code lives in `resources/js/pages/` and `resources/js/components/`. State management via Zustand 5 with stores per domain.

## Testing Commands

### Backend (PHPUnit)
```bash
php artisan test                  # Run all tests
php artisan test --testsuite=Unit
php artisan test --testsuite=Feature
php artisan test --coverage      # With coverage (requires pcov)
```

### Frontend (Vitest)
```bash
npx vitest run              # Run all tests
npx vitest run --coverage   # With coverage (requires @vitest/coverage-v8)
```

## Code Conventions

### UI Text
UI labels, button text, error messages, and user-facing copy are in **Spanish** (Argentina, voseo).

### Technical Artifacts
Code, comments, identifiers, technical documentation, and configuration files are in **English**.

### Style
- Laravel Pint for PHP formatting (`./vendor/bin/pint`)
- Prettier for JS/React formatting (`npx prettier --check resources/js/`)
- ESLint for JS/React linting (`npx eslint resources/js/`)

## Quality Tooling Commands

| Tool | Check | Fix |
|------|-------|-----|
| **PHP Coverage** | `php artisan test --coverage` | N/A (measurement only) |
| **JS Coverage** | `npx vitest run --coverage` | N/A (measurement only) |
| **PHPStan** | `./vendor/bin/phpstan analyse` | `./vendor/bin/phpstan analyse --generate-baseline` |
| **ESLint** | `npx eslint resources/js/` | `npm run lint:fix` |
| **Prettier** | `npx prettier --check resources/js/` | `npm run format` |
| **Pint** | `./vendor/bin/pint --test` | `./vendor/bin/pint` |

## Package Managers

- **PHP**: Composer (`composer require --dev`, `composer remove --dev`)
- **JS**: npm (`npm install -D`, `npm uninstall -D`)

## Key Paths

- Backend: `app/`, `config/`, `database/`, `routes/`
- Frontend: `resources/js/`
- Tests: `tests/Unit`, `tests/Feature` (PHP); `resources/js/**/*.test.{js,jsx}` (JS)
- Coverage output: `coverage/php/html/` (PHP), `coverage/js/` (JS)

## Coverage Notes

PHP coverage uses pcov driver (faster than xdebug). If pcov is unavailable, xdebug can be used as fallback.

JS coverage uses @vitest/coverage-v8 with v8 provider.
