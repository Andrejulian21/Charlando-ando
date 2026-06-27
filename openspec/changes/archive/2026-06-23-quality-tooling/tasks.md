# Tasks: quality-tooling

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~100-120 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR (all 7 items fit) |
| Delivery strategy | ask-on-risk |
| Chain strategy | single-pr-default |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr-default
400-line budget risk: Low

## Phase 1: Foundation — Locale + AGENTS.md

- [x] 1.1 Set `APP_LOCALE=es` and `APP_FALLBACK_LOCALE=es` in `.env` (lines 7-8). Verify: `grep -E "^(APP_LOCALE|APP_FALLBACK_LOCALE)=" .env`
- [x] 1.2 Create `AGENTS.md` at project root: stack (Laravel 13, React 19, Inertia 3, Tailwind 4, Vite 7), conventions, test/quality commands. Verify: `cat AGENTS.md`

## Phase 2: PHP Quality Tooling

- [x] 2.1 Add `pcov/pcov ^1.10` to `composer.json` require-dev; add `<coverage>` block to `phpunit.xml` (pcov driver, text stdout + HTML `tests/coverage/`). Run `composer update --dev pcov/pcov`. Verify: `php artisan test --coverage`
- [x] 2.2 Add `phpstan/phpstan ^2.1` and `larastan/larastan ^3.0` to `composer.json` require-dev; create `phpstan.neon` (level 3, app/ + tests/ paths, includes Larastan extension). Run `composer update --dev phpstan/phpstan larastan/larastan`. Verify: `vendor/bin/phpstan analyse`

## Phase 3: JS Quality Tooling

- [x] 3.1 Add `@vitest/coverage-v8 ^4.1` to `package.json` devDependencies; add coverage block to `vite.config.js` test section (v8 provider, text + html reporters). Run `npm install`. Verify: `npx vitest run --coverage`
- [x] 3.2 Add `prettier ^3.5` to `package.json` devDependencies; create `prettier.config.js` (printWidth: 120, semi, singleQuote, trailingComma: all, tabWidth: 4); add `format` script. Run `npm install`. Verify: `npx prettier --check resources/`
- [x] 3.3 Add `eslint ^9.20`, `@eslint/js ^9.20`, `eslint-plugin-react ^7.37`, `globals ^16.0` to `package.json` devDependencies; create `eslint.config.js` (flat config, recommended + react); add `lint` script. Run `npm install`. Verify: `npx eslint resources/`

## Phase 4: Full Verification

- [x] 4.1 Run all verifications end-to-end: locale check, `AGENTS.md` exists, `php artisan test --coverage`, `npx vitest run --coverage`, `npx prettier --check resources/`, `vendor/bin/phpstan analyse`, `npx eslint resources/`
