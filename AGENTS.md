# AGENTS.md

Instructions for AI coding agents (Claude Code, Codex, opencode, Cursor, Copilot, Kimi Code, …) working **in this repository**.

The canonical machine-readable description of the published package lives in [`llms.txt`](./llms.txt), mirrored below. Edit `llms.txt`, then run `npm run doc:agents` — never edit the mirrored block by hand.

## Repository layout

| Path | Contents |
|---|---|
| `src/` | Single TypeScript source for the plugin; every rule lives here. |
| `tests/` | `node --test` suites (`*.test.mjs`) that run against the **built** output in `dist/`. |
| `docs/rules/` | One Markdown file per rule. Every rule must have one; `npm run doc:check` enforces this. |
| `scripts/` | `gen-rules-table.mjs` (README rules table), `sync-agents-md.mjs` (this file), `test-oxlint.mjs`. |
| `examples/` | Sample configs used for manual verification. |
| `dist/` | Build output (tsup, dual ESM + CJS + `.d.ts`). Generated — never edit. |

## Commands

```bash
npm run build        # tsup -> dist/
npm run typecheck    # tsc --noEmit
npm run test         # build + node --test tests/*.test.mjs
npm run lint         # eslint .
npm run doc          # regenerate the README rules table from rule metadata
npm run doc:agents   # regenerate the mirrored block in AGENTS.md from llms.txt
npm run ci           # lint + typecheck + build + doc:check + tests (run this before pushing)
```

Tests import from `dist/`, so **run `npm run build` after changing `src/`** or tests will exercise stale code. `npm run test` does this for you.

## Conventions

- Rules must work **without type information**. Type-aware behaviour goes behind a `typeAware` option and must degrade gracefully when no TypeScript program is available.
- Rules run under **oxlint** too, so stay within the ESLint rule APIs oxlint's JS-plugin layer supports; verify with `npm run test:oxlint`.
- Adding a rule means: implement in `src/`, register it in the appropriate configs, add `docs/rules/<name>.md`, add tests, list it in `llms.txt`, then run `npm run doc && npm run doc:agents`.
- Prefer conservative detection. False positives in ordinary request/router code are worse than a missed edge case.
- Version bumps happen on the `dev` branch via the pre-commit hook; see [`RELEASING.md`](./RELEASING.md).

## Package summary

<!-- LLMS:START -->

<!-- Generated from llms.txt by scripts/sync-agents-md.mjs — do not edit by hand. -->

> ESLint and oxlint plugin for TypeORM that catches unsafe database access at lint time: raw SQL, SQL injection, schema-destroying config, missing transactions, cross-tenant queries, and performance anti-patterns. Every rule works without type information, so they run in any ESLint 9+ flat config or under oxlint with zero parser setup; rules with a `typeAware` option additionally use TypeScript types when the typescript-eslint parser and a project are configured. Ships as a single TypeScript source compiled to dual ESM + CommonJS with bundled type declarations.

### Install

```bash
npm install --save-dev eslint eslint-plugin-typeorm-enterprise
```

### Use (ESLint 9 flat config)

```js
const typeormEnterprise = require('eslint-plugin-typeorm-enterprise');
module.exports = [typeormEnterprise.configs.recommended];
```

### Use (oxlint)

```json
{ "jsPlugins": ["eslint-plugin-typeorm-enterprise"],
  "rules": { "typeorm-enterprise/no-raw-query": "error",
             "typeorm-enterprise/require-typed-query-result": "error" } }
```

### Rules (prefix: `typeorm-enterprise/`)

- no-raw-query: block static raw SQL passed to query/execute/raw.
- require-parameterized-query: block dynamic interpolated/concatenated SQL (injection).
- no-synchronize-true: block `synchronize: true` in DataSource config (auto-fixable).
- no-entity-manager-query: block raw `.query()` on an EntityManager.
- no-unsafe-query-builder-delete: block QueryBuilder delete/update reaching `.execute()` without `.where()`.
- no-interpolated-where: block interpolated/concatenated QueryBuilder where clauses.
- require-transaction: require mutations to run inside a transaction (strict config).
- prefer-transaction-for-multiple-writes: combine multiple writes into one transaction (strict config).
- require-tenant-scope: require tenant scoping on reads/writes; configurable `tenantKeys` (multiTenant config).
- prefer-exists-over-count: prefer an existence check over counting rows (performance config).
- require-typed-query-result: require raw query results (`query`, `getRawMany`, ...) to declare a row type; type-aware by default (strict config).
- no-untyped-record-escape-hatch: block `any` / `object` / `Record<string, any>` as the declared type of a raw query result; `allowUnknown` permits `Record<string, unknown>` (strict config).
- require-query-runner-release: require `createQueryRunner()` results to be released in a `finally` block, or the pooled connection leaks (recommended config).

### Configs

- recommended (error) and warn: the broadly-safe rules.
- recommendedTypeChecked / strictTypeChecked (error): same rule sets as recommended / strict, with `typeAware: true` on every rule that supports it; needs the typescript-eslint parser with a project or projectService.
- strict (error): recommended + require-transaction + prefer-transaction-for-multiple-writes + require-typed-query-result + no-untyped-record-escape-hatch.
- performance (warn): prefer-exists-over-count.
- multiTenant (error): recommended + require-tenant-scope.

### Compatibility

- ESLint: `^9 || ^10`. Node: `>=18`.
- oxlint: works via its JS-plugin API (rule prefix `typeorm-enterprise/`).
- TypeScript: not required to use the package; ships compiled JS + `.d.ts` and works with any TS version or none.

### Links

- This file (canonical URL): https://alokraj68.github.io/eslint-plugin-typeorm-enterprise/llms.txt
- Docs: https://github.com/alokraj68/eslint-plugin-typeorm-enterprise#readme
- Rule docs: https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/tree/main/docs/rules
- npm: https://www.npmjs.com/package/eslint-plugin-typeorm-enterprise
- Issues: https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/issues

<!-- LLMS:END -->
