# Design: quality-tooling

## Technical Approach

Install six independent quality tools (PHP coverage, JS coverage, Prettier, PHPStan, ESLint, AGENTS.md) plus a locale fix. Each tool is a dev-only dependency with conservative defaults. No enforcement thresholds — measurement only. All configs use current recommended formats (flat config for ESLint, NEON for PHPStan). Tools are independently invocable with no cross-tool orchestration.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| PHP coverage driver | pcov | xdebug | pcov is 10x faster, lower memory, designed for coverage-only. xdebug is a full debugger with coverage as a side effect. |
| JS coverage provider | @vitest/coverage-v8 | istanbul, c8 | v8 is Vitest's native provider, zero-config, fastest. istanbul requires babel instrumentation. |
| Prettier line width | 120 | 80 (default) | Matches existing Pint config (`pint.json`), avoids conflict between PHP and JS formatters. |
| PHPStan level | 3 | 0-9 | Level 3 catches real bugs (undefined variables, wrong arg counts) without overwhelming the team. Higher levels can be adopted incrementally. |
| ESLint config format | flat config | legacy .eslintrc | Flat config is the current standard (ESLint 9+), simpler, no JSON, better TypeScript support if adopted later. |
| Dependency scope | dev-only | production | All tools are build-time only. Adding to production deps bloats the deployment and violates NF-001. |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `.env` | Modify | Change `APP_LOCALE=en` → `es`, `APP_FALLBACK_LOCALE=en` → `es` |
| `composer.json` | Modify | Add `pcov/pcov`, `phpstan/phpstan`, `larastan/larastan` to `require-dev` |
| `package.json` | Modify | Add `@vitest/coverage-v8`, `prettier`, `eslint`, `@eslint/js`, `eslint-plugin-react`, `globals` to `devDependencies`. Add scripts: `format`, `lint`, `coverage` |
| `phpunit.xml` | Modify | Add `<coverage>` block with pcov driver, text + html reporters, output to `tests/coverage/` |
| `vite.config.js` | Modify | Add `coverage` block to `test` section with v8 provider, text + html reporters |
| `prettier.config.js` | Create | `printWidth: 120`, `trailingComma: 'all'`, `semi: true`, `singleQuote: true`, `tabWidth: 4` |
| `phpstan.neon` | Create | Level 3, includes `larastan/extension.neon`, paths `app/` and `tests/` |
| `eslint.config.js` | Create | Flat config with `@eslint/js` recommended + `eslint-plugin-react` recommended |
| `AGENTS.md` | Create | Stack info (Laravel 13, Inertia 2, React 19, Tailwind 4, Vite 7), conventions, test/quality commands |

## Interfaces / Contracts

### phpunit.xml coverage block
```xml
<coverage>
    <report>
        <text outputFile="php://stdout"/>
        <html outputDirectory="tests/coverage"/>
    </report>
</coverage>
```

### vite.config.js test.coverage block
```js
test: {
    // existing config...
    coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        reportsDirectory: 'coverage',
    },
},
```

### prettier.config.js
```js
export default {
    printWidth: 120,
    trailingComma: 'all',
    semi: true,
    singleQuote: true,
    tabWidth: 4,
};
```

### phpstan.neon
```neon
includes:
    - vendor/larastan/larastan/extension.neon

parameters:
    level: 3
    paths:
        - app
        - tests
```

### eslint.config.js
```js
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import globals from 'globals';

export default [
    js.configs.recommended,
    {
        files: ['resources/**/*.{js,jsx}'],
        plugins: { react },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: { ...globals.browser, ...globals.es2021 },
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        rules: {
            ...react.configs.recommended.rules,
        },
        settings: {
            react: { version: 'detect' },
        },
    },
];
```

## Testing Strategy

| Tool | Verification Command | Expected Result |
|------|---------------------|-----------------|
| PHP Coverage | `php artisan test --coverage` | Text summary in stdout, HTML at `tests/coverage/index.html` |
| JS Coverage | `npx vitest run --coverage` | Text summary in stdout, HTML at `coverage/index.html` |
| Prettier | `npx prettier --check resources/` | Runs without config errors (may report formatting diffs) |
| PHPStan | `./vendor/bin/phpstan analyse` | Runs at level 3 without config/bootstrap errors |
| ESLint | `npx eslint resources/` | Runs without config errors (may report lint violations) |
| Locale | `grep APP_LOCALE .env` | Shows `APP_LOCALE=es` |
| AGENTS.md | `cat AGENTS.md` | File exists with stack + commands |

## Migration / Rollout

**Per-item rollback:**

1. **Locale**: Revert `.env` lines 7-8 to `en`
2. **AGENTS.md**: Delete file
3. **PHP Coverage**: Remove `<coverage>` block from `phpunit.xml`, run `composer remove --dev pcov/pcov`
4. **JS Coverage**: Remove `coverage` block from `vite.config.js`, run `npm uninstall @vitest/coverage-v8`
5. **Prettier**: Delete `prettier.config.js`, remove `format` script from `package.json`, run `npm uninstall prettier`
6. **PHPStan**: Delete `phpstan.neon`, run `composer remove --dev phpstan/phpstan larastan/larastan`
7. **ESLint**: Delete `eslint.config.js`, remove `lint` script from `package.json`, run `npm uninstall eslint @eslint/js eslint-plugin-react globals`

**Full rollback**: Revert `composer.json` + `package.json`, delete new config files, run `composer install` + `npm install` to remove packages.

## Package Versions

### Composer (require-dev)
- `pcov/pcov`: `^1.10`
- `phpstan/phpstan`: `^2.1`
- `larastan/larastan`: `^3.0`

### npm (devDependencies)
- `@vitest/coverage-v8`: `^4.1`
- `prettier`: `^3.5`
- `eslint`: `^9.20`
- `@eslint/js`: `^9.20`
- `eslint-plugin-react`: `^7.37`
- `globals`: `^16.0`

## Open Questions

None — all requirements are clear from the spec, and the approach follows the proposal's conservative defaults.
