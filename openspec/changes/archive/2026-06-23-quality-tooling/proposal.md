# Proposal: quality-tooling

## Intent

The project currently lacks coverage measurement, JS formatting, PHP static analysis, and JS linting. This change establishes baseline quality tooling so the team can measure health before enforcing gates. It also fixes the app locale mismatch and creates a project-level AGENTS.md.

## Scope

### In Scope
- Change `APP_LOCALE` from `en` to `es` in `.env`
- Create `AGENTS.md` with stack info, conventions, and test commands
- Add `pcov/pcov` and configure `phpunit.xml` for text + HTML coverage
- Install `@vitest/coverage-v8` and add coverage config to `vite.config.js`
- Install `prettier` with width 120 config
- Install `phpstan/phpstan` + `larastan/larastan`, create `phpstan.neon` at level 3
- Install `eslint` + `eslint-plugin-react` + `@eslint/js` with flat config (recommended rules)

### Out of Scope
- Fixing existing PHPStan or ESLint violations (measurement only)
- CI pipeline integration or pre-commit hooks
- TypeScript adoption or strict type checking
- Changing Pint rules or existing code style

## Capabilities

### New Capabilities
- `quality-tooling`: Configure linting, formatting, type-checking, and coverage tools for both PHP and JS stacks

### Modified Capabilities
- None (pure tooling/infrastructure change)

## Approach

Install each tool via composer/npm with conservative defaults. Coverage threshold is 0 (measurement only). PHPStan starts at level 3. ESLint uses recommended + React plugin. Prettier line width matches Pint at 120. All configs are additive — no existing behavior changes.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `.env` | Modified | `APP_LOCALE=en` → `es` |
| `AGENTS.md` | New | Project-level agent context file |
| `phpunit.xml` | Modified | Add `pcov` coverage output (text + html) |
| `composer.json` | Modified | Add `pcov/pcov`, `phpstan/phpstan`, `larastan/larastan` |
| `vite.config.js` | Modified | Add `coverage` block to `test` section |
| `package.json` | Modified | Add `prettier`, `eslint`, plugins, `@vitest/coverage-v8` |
| `prettier.config.js` | New | Width 120, trailing commas |
| `phpstan.neon` | New | Level 3, includes Larastan |
| `eslint.config.js` | New | Flat config, recommended + React |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| PHPStan level 3 surfaces many errors | Medium | Run with `--generate-baseline` if needed; level 3 is intentionally conservative |
| Dependency conflicts with React 19 / Tailwind 4 | Low | Pin compatible versions; test `npm install` immediately |
| pcov not available in CI later | Low | Document fallback to xdebug in AGENTS.md |

## Rollback Plan

1. Revert `composer.json` and `package.json` changes
2. Delete new config files: `prettier.config.js`, `phpstan.neon`, `eslint.config.js`, `AGENTS.md`
3. Revert `.env` locale change
4. Run `composer install` and `npm install` to remove added packages

## Dependencies

- Composer and npm CLI available
- `phpunit` and `vitest` already configured

## Success Criteria

- [ ] `php artisan test --coverage` outputs text + generates HTML report
- [ ] `npx vitest run --coverage` outputs coverage report
- [ ] `./vendor/bin/phpstan analyse` runs at level 3 without config errors
- [ ] `npx prettier --check` runs without config errors
- [ ] `npx eslint` runs without config errors
- [ ] `.env` contains `APP_LOCALE=es`
- [ ] `AGENTS.md` exists and documents stack + commands
