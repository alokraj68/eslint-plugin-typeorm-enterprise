<div align="center">

# 🛡️ eslint-plugin-typeorm-enterprise

**Stop raw SQL before it reaches production.**

A production-ready ESLint plugin that blocks raw SQL execution in TypeORM applications and enforces enterprise backend governance — steering teams toward query builders, repositories, migrations, and safe database abstractions.

[![CI](https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/actions/workflows/ci.yml/badge.svg)](https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/actions/workflows/ci.yml)
[![CodeQL](https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/actions/workflows/codeql.yml/badge.svg)](https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/actions/workflows/codeql.yml)
[![Publish](https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/actions/workflows/publish.yml/badge.svg)](https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/actions/workflows/publish.yml)
[![codecov](https://codecov.io/gh/alokraj68/eslint-plugin-typeorm-enterprise/branch/main/graph/badge.svg)](https://codecov.io/gh/alokraj68/eslint-plugin-typeorm-enterprise)
[![npm version](https://img.shields.io/npm/v/eslint-plugin-typeorm-enterprise.svg)](https://www.npmjs.com/package/eslint-plugin-typeorm-enterprise)
[![npm downloads](https://img.shields.io/npm/dm/eslint-plugin-typeorm-enterprise.svg)](https://www.npmjs.com/package/eslint-plugin-typeorm-enterprise)
[![install size](https://packagephobia.com/badge?p=eslint-plugin-typeorm-enterprise)](https://packagephobia.com/result?p=eslint-plugin-typeorm-enterprise)
[![types included](https://img.shields.io/npm/types/eslint-plugin-typeorm-enterprise.svg)](https://www.npmjs.com/package/eslint-plugin-typeorm-enterprise)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/blob/main/LICENSE)
[![ESLint 9+](https://img.shields.io/badge/ESLint-9%2B-4B32C3.svg?logo=eslint)](https://eslint.org)
[![Node >=18](https://img.shields.io/badge/Node-%3E%3D18-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org)

Works with any TypeScript version — or none at all (ships compiled JS + a bundled `.d.ts`):

[![TypeScript 5](https://img.shields.io/badge/TypeScript%205-supported-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TypeScript 6](https://img.shields.io/badge/TypeScript%206-supported-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TypeScript 7](https://img.shields.io/badge/TypeScript%207-supported-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-supported-F7DF1E.svg?logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)

</div>

---

## ✨ Why this plugin?

Raw and dynamically-built SQL scattered across a TypeORM codebase is a governance and security liability: it bypasses query builders, invites injection, and fragments data-access patterns across large teams. This plugin catches those patterns at lint time — **before review, before merge, before prod** — while staying conservative enough to avoid false positives in ordinary request/router code.

| | |
|---|---|
| 🚫 **Blocks raw SQL** | Static (`no-raw-query`) and dynamic / injected (`require-parameterized-query`, `no-interpolated-where`) SQL |
| 🧨 **Guards your data** | `no-synchronize-true` (auto-fixable) and `no-unsafe-query-builder-delete` stop schema wipes and full-table mutations |
| 🧱 **Enforces abstractions** | `no-entity-manager-query`, `require-transaction`, `prefer-transaction-for-multiple-writes` keep access in safe layers |
| 🔒 **Keeps raw results typed** | `require-typed-query-result` forces a row shape on `query()` / `getRawMany()`; `no-untyped-record-escape-hatch` blocks `any` and `Record<string, any>` from standing in for one |
| 🏢 **Multi-tenant aware** | `require-tenant-scope` with configurable `tenantKeys` catches cross-tenant queries |
| 🚀 **Performance hints** | `prefer-exists-over-count` steers existence checks away from row counts |
| 🎚️ **Config tiers** | `recommended`, `warn`, `strict`, `performance`, `multiTenant` shareable configs |
| 📦 **Dual ESM + CJS** | Single TypeScript source compiled to `.mjs`, `.cjs`, and `.d.ts` |

## 📚 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Configs](#-configs)
- [Rules](#-rules)
- [How it works](#-how-it-works)
- [For AI coding agents](#-for-ai-coding-agents)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Also by the author](#-also-by-the-author)
- [License](#-license)

## ✅ Requirements

- **Node** `>=18`
- **ESLint** `^9 || ^10` (flat config), or **oxlint** via its JS-plugin API
- **TypeScript** is optional — the package ships compiled JS and bundled types,
  so it works with any TypeScript version or none at all.

## 📦 Installation

```bash
npm install --save-dev eslint eslint-plugin-typeorm-enterprise
```

## 🚀 Quick Start

### Flat config — `eslint.config.js` (ESLint 9+)

Extend a shipped config:

```js
const typeormEnterprise = require('eslint-plugin-typeorm-enterprise');

module.exports = [typeormEnterprise.configs.recommended];
```

Or wire rules by hand:

```js
const typeormEnterprise = require('eslint-plugin-typeorm-enterprise');

module.exports = [
  {
    plugins: { 'typeorm-enterprise': typeormEnterprise },
    rules: {
      'typeorm-enterprise/no-raw-query': 'error',
      'typeorm-enterprise/require-parameterized-query': 'error',
      'typeorm-enterprise/no-synchronize-true': 'error',
      'typeorm-enterprise/no-entity-manager-query': 'error',
    },
  },
];
```

### Legacy `.eslintrc`

```js
module.exports = {
  plugins: ['typeorm-enterprise'],
  rules: {
    'typeorm-enterprise/no-raw-query': 'error',
    'typeorm-enterprise/require-parameterized-query': 'error',
  },
};
```

### oxlint (`.oxlintrc.json`)

Every rule works without type information, so they run under
[oxlint](https://oxc.rs)'s JS-plugin API (ESLint v9-compatible, currently alpha)
with no adapter:

```json
{
  "jsPlugins": ["eslint-plugin-typeorm-enterprise"],
  "rules": {
    "typeorm-enterprise/no-raw-query": "error",
    "typeorm-enterprise/require-parameterized-query": "error",
    "typeorm-enterprise/no-unsafe-query-builder-delete": "error",
    "typeorm-enterprise/require-typed-query-result": "error",
    "typeorm-enterprise/no-untyped-record-escape-hatch": "error"
  }
}
```

The plugin's `meta.name` is `typeorm-enterprise`, so rule names are identical
across ESLint and oxlint. Shareable configs are an ESLint feature — under oxlint,
enable rules individually as above.

oxlint has no type-aware support, so rules with a `typeAware` option fall back to
their AST-only behavior there automatically — including
`require-typed-query-result` and `no-untyped-record-escape-hatch`, which identify
the receiver by name and read the type the developer wrote. oxlint parses
TypeScript natively, so annotations and type arguments are still seen.

### Framework recipes

Copy-paste starters live in [`examples/`](./examples):

- **NestJS** — [`nestjs.eslint.config.mjs`](./examples/nestjs.eslint.config.mjs) (`strict` + `performance`)
- **Express / Node** — [`express.eslint.config.js`](./examples/express.eslint.config.js)
- **Multi-tenant** — [`multitenant.eslint.config.mjs`](./examples/multitenant.eslint.config.mjs) (custom `tenantKeys`)
- **oxlint** — [`examples/.oxlintrc.json`](./examples/.oxlintrc.json)

## 🎚️ Configs

| Config | Severity | Contents |
|---|---|---|
| `recommended` | `error` | Broadly-safe rules: raw SQL, injection, schema, EntityManager, unsafe deletes |
| `warn` | `warn` | Same rules as `recommended`, as warnings |
| `strict` | `error` | `recommended` + `require-transaction` + `prefer-transaction-for-multiple-writes` + `require-typed-query-result` + `no-untyped-record-escape-hatch` |
| `recommendedTypeChecked` | `error` | Same rules as `recommended`, with `typeAware: true` wherever the rule supports it |
| `strictTypeChecked` | `error` | Same rules as `strict`, with `typeAware: true` wherever the rule supports it |
| `performance` | `warn` | Performance-tuning hints (`prefer-exists-over-count`) |
| `multiTenant` | `error` | `recommended` + `require-tenant-scope` |

```js
const typeormEnterprise = require('eslint-plugin-typeorm-enterprise');

module.exports = [
  typeormEnterprise.configs.strict,       // maximum enforcement
  typeormEnterprise.configs.performance,  // + perf warnings
  // typeormEnterprise.configs.multiTenant, // for multi-tenant apps
];
```

### Type-checked configs

Several rules take a `typeAware` option that confirms the receiver by its
TypeScript type instead of its name — fewer false positives, and TypeORM objects
are caught under any variable name. Setting it per rule is easy to miss, so
`recommendedTypeChecked` and `strictTypeChecked` turn it on everywhere it
applies:

```js
import tseslint from 'typescript-eslint';
import typeormEnterprise from 'eslint-plugin-typeorm-enterprise';

export default [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  typeormEnterprise.configs.strictTypeChecked,
];
```

They need the [`typescript-eslint`](https://typescript-eslint.io) parser with a
project or `projectService`. Without it every rule falls back to its AST-only
behavior, so enabling the config ahead of the parser setup is safe — it just
does less.

## 📏 Rules

<!-- RULES:START -->

| Rule | Description | 🔧 | Config |
|---|---|:--:|:--:|
| [`no-raw-query`](./docs/rules/no-raw-query.md) | Disallow raw SQL execution through TypeORM query helpers and raw SQL methods. |  | ✅ recommended |
| [`require-parameterized-query`](./docs/rules/require-parameterized-query.md) | Require parameterized queries instead of interpolated or concatenated raw SQL. |  | ✅ recommended |
| [`no-synchronize-true`](./docs/rules/no-synchronize-true.md) | Disallow enabling `synchronize: true` in TypeORM data source configuration. | 🔧 | ✅ recommended |
| [`no-entity-manager-query`](./docs/rules/no-entity-manager-query.md) | Disallow raw queries executed directly on a TypeORM EntityManager. |  | ✅ recommended |
| [`require-transaction`](./docs/rules/require-transaction.md) | Require data-mutating operations to run inside a transaction callback. |  | ⚠️ strict |
| [`no-unsafe-query-builder-delete`](./docs/rules/no-unsafe-query-builder-delete.md) | Disallow QueryBuilder delete/update chains that execute without a where clause. |  | ✅ recommended |
| [`no-interpolated-where`](./docs/rules/no-interpolated-where.md) | Disallow interpolated or concatenated strings in QueryBuilder where clauses. |  | ✅ recommended |
| [`prefer-transaction-for-multiple-writes`](./docs/rules/prefer-transaction-for-multiple-writes.md) | Suggest combining multiple write operations into a single transaction. |  | ⚠️ strict |
| [`require-tenant-scope`](./docs/rules/require-tenant-scope.md) | Require tenant-scoped access on TypeORM read and write operations (multi-tenant). |  | 🏢 multiTenant |
| [`prefer-exists-over-count`](./docs/rules/prefer-exists-over-count.md) | Prefer an existence check over counting rows when only presence matters. |  | 🚀 performance |
| [`require-typed-query-result`](./docs/rules/require-typed-query-result.md) | Require raw TypeORM query results to be explicitly typed. |  | ⚠️ strict |
| [`no-untyped-record-escape-hatch`](./docs/rules/no-untyped-record-escape-hatch.md) | Disallow typing raw TypeORM query results with escape hatches such as any, object or Record<string, any>. |  | ⚠️ strict |
| [`require-query-runner-release`](./docs/rules/require-query-runner-release.md) | Require a QueryRunner to be released in a finally block. |  | ✅ recommended |

<!-- RULES:END -->

🔧 = auto-fixable. Full option references live in [`docs/rules/`](./docs/rules).
Run `npm run doc` to regenerate this table from rule metadata.

## 🧠 How it works

The plugin is written in **TypeScript** (`src/`) and compiled with
[tsup](https://tsup.egoist.dev) into a dual ESM + CommonJS bundle plus type
declarations (`dist/`). Every rule is AST-based and requires no type information
from your project, so it works in any ESLint 9 setup with zero parser config.

Each rule resolves the call's callee (method + object name), applies the
configured allow/restrict lists and `ignorePatterns` globs, and only then
inspects the relevant argument. The design is deliberately conservative: it
enforces the patterns it can prove and stays quiet on everything else.

## 🤖 For AI coding agents

This package ships a machine-readable summary following the
[llms.txt](https://llmstxt.org) convention — every rule, every config, and the
compatibility matrix in ~60 lines, so an agent can configure the plugin
correctly without reading this README.

| Where | What |
|---|---|
| <https://alokraj68.github.io/eslint-plugin-typeorm-enterprise/llms.txt> | Canonical hosted copy — fetchable by any agent with web access |
| `node_modules/eslint-plugin-typeorm-enterprise/llms.txt` | Same file, shipped in the npm tarball for offline/local agents |
| [`AGENTS.md`](./AGENTS.md) | Instructions for agents working **in this repository** (layout, commands, conventions) |

**Using this plugin in your project?** Point your agent at the hosted URL, or
add a line to your own `AGENTS.md` / `CLAUDE.md`:

```md
Lint rules for TypeORM data access come from eslint-plugin-typeorm-enterprise.
Rule reference: node_modules/eslint-plugin-typeorm-enterprise/llms.txt
```

`llms.txt` is the source of truth: `AGENTS.md` is generated from it by
`npm run doc:agents`, and CI fails on drift.

## 🗺️ Roadmap

- [x] Twelve rules across SQL safety, schema, transactions, multi-tenancy, result typing, and performance
- [x] `recommended` / `warn` / `strict` / `performance` / `multiTenant` configs
- [x] TypeScript source with tsup build (dual ESM + CJS)
- [x] CI matrix (Node 18/20/22 · TypeScript 5.5–7) + coverage
- [x] Auto-generated rules table (drift-checked in CI)
- [x] Runs under both ESLint 9+ and oxlint (JS-plugin API)
- [x] npm publish via Trusted Publishing (OIDC) with provenance
- [x] Optional type-aware detection (`typeAware`) across all receiver-based rules, with graceful AST-only fallback
- [x] `llms.txt` + `AGENTS.md` for AI coding agents, published to GitHub Pages
- [ ] Autofix suggestions toward Repository / QueryBuilder APIs
- [ ] Documentation site / playground

## 🤝 Contributing

```bash
git clone https://github.com/alokraj68/eslint-plugin-typeorm-enterprise.git
cd eslint-plugin-typeorm-enterprise
npm install
npm run ci        # lint + typecheck + build + test
```

Handy scripts:

| Script | Does |
|---|---|
| `npm run build` | Compile `src/` → `dist/` (ESM + CJS + d.ts) |
| `npm run lint` | ESLint (typescript-eslint) over `src/` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Build, then run the rule test suites |
| `npm run coverage` | Test with coverage report |

Every push and PR runs the CI matrix; merges to `main` auto-publish when the
`package.json` version bumps. Please read the
[Code of Conduct](https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/blob/main/CODE_OF_CONDUCT.md)
and [Contributing guide](https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/blob/main/CONTRIBUTING.md).

## 🧰 Also by the author

Same working principle as this plugin: if a rule matters, it fails the build rather
than living in a checklist someone is trusted to follow.

[craftkit](https://github.com/alokraj68/craftkit) is four of them for Claude Code, installed in one command:

```bash
npx @alokraj68/craftkit
```

| | | |
|---|---|---|
| ✍️ [`plainspoken`](https://www.npmjs.com/package/@alokraj68/plainspoken) | [docs](https://github.com/alokraj68/craftkit/tree/main/plugins/plainspoken) | prose that does not read as machine-written |
| 📱 [`pagecheck`](https://www.npmjs.com/package/@alokraj68/pagecheck) | [docs](https://github.com/alokraj68/craftkit/tree/main/plugins/pagecheck) | pages that survive a phone: overflow, tiny text, tap targets, WCAG AA |
| 📄 [`ats-resume`](https://www.npmjs.com/package/@alokraj68/ats-resume) | [docs](https://github.com/alokraj68/craftkit/tree/main/plugins/ats-resume) | a résumé an applicant tracking system can parse, and JD gap analysis |
| 🧭 [`craft-setup`](https://github.com/alokraj68/craftkit/tree/main/plugins/craft-setup) | skill only | verify before claiming done; never commit unasked |

🌐 [alokraj68.in](https://alokraj68.in) — who writes these, and what they were built for.

## 📄 License

[MIT](https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/blob/main/LICENSE) © alokraj68
