# quality-tooling Specification

## Purpose

Establish baseline quality tooling for the Charlando-ando Laravel + React codebase: coverage measurement (PHP + JS), PHP static analysis, JS formatting, and JS linting. Thresholds start at zero — this is measurement-only, not enforcement. Also fixes the app locale and creates a project-level AGENTS.md.

## Requirements

| # | Requirement | Strength |
|---|-------------|----------|
| QT-001 | `.env` SHALL set `APP_LOCALE=es` and `APP_FALLBACK_LOCALE=es` | MUST |
| QT-002 | A project-level `AGENTS.md` SHALL document the tech stack, conventions, and test/quality commands | MUST |
| QT-003 | `phpunit.xml` SHALL configure the `pcov` driver with text and HTML coverage output targeting `app/` sources | MUST |
| QT-004 | `vite.config.js` SHALL include `@vitest/coverage-v8` provider configuration in the `test` block with `text` + `html` reporters | MUST |
| QT-005 | `prettier.config.js` SHALL set `printWidth: 120`, `trailingComma: "all"`, `semi: true`, `singleQuote: true`, `tabWidth: 4` | MUST |
| QT-006 | `phpstan.neon` SHALL enable PHPStan level 3 with the Larastan extension, scanning `app/` and `tests/` | MUST |
| QT-007 | `eslint.config.js` SHALL adopt the flat config format with `@eslint/js` recommended rules and `eslint-plugin-react` enabled | MUST |

## Scenarios

### QT-001: Application Locale

#### Scenario: Locale set to Spanish
- GIVEN the project `.env` file
- WHEN any developer or CI reads `APP_LOCALE`
- THEN the value is `es` and `APP_FALLBACK_LOCALE` is `es`

#### Scenario: .env.example preserved
- GIVEN the `env.example` file
- WHEN the locale change is applied
- THEN `.env.example` SHALL retain its original `APP_LOCALE=en` unless explicitly updated

### QT-002: Project AGENTS.md

#### Scenario: AGENTS.md exists and is structured
- GIVEN a fresh clone of the repository
- WHEN an agent or developer opens `AGENTS.md` at the project root
- THEN it SHALL contain stack identification (Laravel 13, Inertia 2, React 19, Tailwind 4, Vite 7), code conventions, and exact commands for testing, linting, and formatting

#### Scenario: Commands are runnable
- GIVEN the commands listed in AGENTS.md under "Testing" and "Quality"
- WHEN executed in a properly configured environment
- THEN each command SHALL succeed (no config errors, no missing dependencies)

### QT-003: PHP Code Coverage

#### Scenario: Coverage command produces text output
- GIVEN `pcov` is loaded and `phpunit.xml` includes the `<coverage>` block
- WHEN `php artisan test --coverage` is executed
- THEN a text coverage summary appears in stdout listing covered classes and percentages

#### Scenario: HTML report is generated
- GIVEN the coverage run completes
- WHEN the command finishes
- THEN an HTML report exists at `tests/coverage/index.html` (or configured output directory)

#### Scenario: Coverage driver is pcov
- GIVEN `phpunit.xml` coverage configuration
- WHEN PHPUnit starts
- THEN it SHALL use the `pcov` driver (not xdebug) if available

### QT-004: JavaScript Code Coverage

#### Scenario: Vitest coverage command runs
- GIVEN `@vitest/coverage-v8` is installed and configured in `vite.config.js`
- WHEN `npx vitest run --coverage` is executed
- THEN a text coverage summary appears in stdout

#### Scenario: HTML coverage report generated
- GIVEN the Vitest coverage run completes
- WHEN the command finishes
- THEN an HTML report exists at `coverage/index.html`

#### Scenario: Coverage thresholds are zero
- GIVEN the coverage configuration in `vite.config.js`
- WHEN coverage is run
- THEN no build or test failure occurs regardless of coverage percentage (thresholds excluded or set to 0)

### QT-005: JavaScript Formatting

#### Scenario: Prettier check runs without config errors
- GIVEN `prettier` is installed and `prettier.config.js` exists
- WHEN `npx prettier --check resources/` is executed
- THEN Prettier reads the config successfully (it MAY report formatting differences, but SHALL NOT error on config)

#### Scenario: Line width matches Pint
- GIVEN `prettier.config.js` and `pint.json`
- WHEN comparing their effective line-width settings
- THEN both enforce `120` characters as the maximum line length

### QT-006: PHP Static Analysis

#### Scenario: PHPStan runs at level 3
- GIVEN `phpstan/phpstan` and `larastan/larastan` are installed, `phpstan.neon` exists
- WHEN `./vendor/bin/phpstan analyse` is executed
- THEN it SHALL run with level 3 rules and SHALL NOT emit configuration or bootstrap errors

#### Scenario: Larastan extension loaded
- GIVEN `phpstan.neon` includes the Larastan extension and `phpstan/phpstan-larastan` rules
- WHEN PHPStan starts analysis
- THEN it recognizes Laravel facades, helpers, and Eloquent magic without false-positive undefined errors

#### Scenario: Baseline generation available
- GIVEN PHPStan level 3 reports many existing violations
- WHEN `./vendor/bin/phpstan analyse --generate-baseline` is executed
- THEN a `phpstan-baseline.neon` file is generated, allowing the team to suppress known issues temporarily

### QT-007: JavaScript Linting

#### Scenario: ESLint runs with flat config
- GIVEN `eslint`, `@eslint/js`, and `eslint-plugin-react` are installed, `eslint.config.js` exists
- WHEN `npx eslint resources/` is executed
- THEN ESLint reads the flat config successfully (it MAY report lint violations, but SHALL NOT error on config)

#### Scenario: React rules are active
- GIVEN `eslint.config.js` includes `eslint-plugin-react`
- WHEN ESLint analyzes JSX files in `resources/js/`
- THEN React-specific rules (e.g., `react/prop-types`, `react/jsx-key`) are enforced

## Non-Functional Requirements

| # | Requirement | Strength |
|---|-------------|----------|
| NF-001 | All new dev dependencies SHALL be added to `require-dev` (composer) or `devDependencies` (npm) — never to production dependencies | MUST |
| NF-002 | No existing test, build, or command SHALL break after installation | MUST |
| NF-003 | Config files SHALL use the tool's current recommended format (flat config for ESLint, NEON for PHPStan) | MUST |
| NF-004 | Each tool SHALL be independently invocable (no cross-tool orchestration required) | MUST |
| NF-005 | Coverage, lint, and analysis SHALL run without modifying the source tree | MUST |

## Acceptance Criteria

- [ ] `APP_LOCALE=es` in `.env`
- [ ] `AGENTS.md` exists at project root with stack and command documentation
- [ ] `php artisan test --coverage` prints text summary and generates HTML report
- [ ] `npx vitest run --coverage` prints text summary and generates HTML report
- [ ] `npx prettier --check resources/` runs without configuration errors
- [ ] `./vendor/bin/phpstan analyse` runs at level 3 without configuration errors
- [ ] `npx eslint resources/` runs without configuration errors
- [ ] `composer.json` and `package.json` dependencies are in dev-only sections
