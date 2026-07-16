<div align="center">

# 🛡️ eslint-plugin-typeorm-enterprise

**Stop raw SQL before it reaches production.**

A production-ready ESLint plugin that blocks raw SQL execution in TypeORM applications and enforces enterprise backend governance — steering teams toward query builders, repositories, and safe database abstractions.

[![CI](https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/actions/workflows/ci.yml/badge.svg)](https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/actions/workflows/ci.yml)
[![Publish](https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/actions/workflows/publish.yml/badge.svg)](https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/actions/workflows/publish.yml)
[![npm version](https://img.shields.io/npm/v/eslint-plugin-typeorm-enterprise.svg)](https://www.npmjs.com/package/eslint-plugin-typeorm-enterprise)
[![npm downloads](https://img.shields.io/npm/dm/eslint-plugin-typeorm-enterprise.svg)](https://www.npmjs.com/package/eslint-plugin-typeorm-enterprise)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/blob/main/LICENSE)
[![ESLint 9+](https://img.shields.io/badge/ESLint-9%2B-4B32C3.svg?logo=eslint)](https://eslint.org)
[![Node >=18](https://img.shields.io/badge/Node-%3E%3D18-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org)

</div>

---

## ✨ Why this plugin?

Raw SQL scattered across a TypeORM codebase is a governance and security liability: it bypasses query builders, invites injection, and fragments data-access patterns across large teams. This plugin catches static raw SQL at lint time — **before review, before merge, before prod** — while staying conservative enough to avoid false positives in ordinary request/router code.

| | |
|---|---|
| 🚫 **Blocks raw SQL** | Flags `SELECT / INSERT / UPDATE / DELETE / WITH / ALTER / DROP / CREATE / TRUNCATE` passed to `query`, `execute`, `raw` |
| 🎯 **Low false positives** | Only static strings & template literals — dynamic values (`query(sql)`) are left alone |
| 🧩 **Configurable** | Allow/restrict operations, methods, object names, and file globs |
| 🏢 **Enterprise-ready** | Centralize SQL policy across monorepos; extensible for future governance rules |
| 📦 **Dual ESM + CJS** | Ships `.mjs`, `.cjs`, and `.d.ts` — works with flat config and legacy `.eslintrc` |

## 📚 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Rule: `no-raw-query`](#-rule-typeorm-enterpriseno-raw-query)
- [Options](#-options)
- [Examples](#-examples)
- [How it works](#-how-it-works)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

## 📦 Installation

```bash
npm install --save-dev eslint eslint-plugin-typeorm-enterprise
```

## 🚀 Quick Start

### Flat config — `eslint.config.js` (ESLint 9+)

```js
const typeormEnterprise = require('eslint-plugin-typeorm-enterprise');

module.exports = [
  {
    plugins: { 'typeorm-enterprise': typeormEnterprise },
    rules: { 'typeorm-enterprise/no-raw-query': 'error' },
  },
];
```

Or extend the shipped `recommended` config:

```js
const typeormEnterprise = require('eslint-plugin-typeorm-enterprise');

module.exports = [typeormEnterprise.configs.recommended];
```

### Legacy `.eslintrc`

```js
module.exports = {
  plugins: ['typeorm-enterprise'],
  rules: {
    'typeorm-enterprise/no-raw-query': 'error',
  },
};
```

## 🔎 Rule: `typeorm-enterprise/no-raw-query`

Prevents raw SQL execution through TypeORM-style methods and standalone query helpers. It inspects the **first argument** for static SQL strings and template literals, and deliberately ignores dynamic values to avoid flagging non-SQL control flow.

**Detected operations:** `SELECT` · `INSERT` · `UPDATE` · `DELETE` · `WITH` · `ALTER` · `DROP` · `CREATE` · `TRUNCATE`

## ⚙️ Options

```js
{
  restrictedOperations: [], // SQL ops to block (default: all supported)
  allowedOperations:    [], // ops to permit, overrides restricted
  restrictedMethods:    [], // methods to inspect (default: ["query","execute","raw"])
  allowedObjectNames:   [], // object names allowed to run raw SQL
  ignorePatterns:       [], // file globs to skip entirely
}
```

| Option | Type | Default | Purpose |
|---|---|---|---|
| `restrictedOperations` | `string[]` | all supported ops | Which SQL operations to block |
| `allowedOperations` | `string[]` | `[]` | Whitelist that overrides restricted ops |
| `restrictedMethods` | `string[]` | `["query","execute","raw"]` | Method/function names to inspect |
| `allowedObjectNames` | `string[]` | `[]` | Objects permitted to execute raw SQL |
| `ignorePatterns` | `string[]` | `[]` | Globs (e.g. `**/migrations/**`) to skip |

## 💡 Examples

```js
// ❌ invalid — flagged
repo.query('SELECT * FROM users');
manager.query(`DELETE FROM users`);
db.execute('UPDATE users SET name = ?');
raw('INSERT INTO users (name) VALUES (?)');

// ✅ valid — allowed
req.query.id;                       // property access, not a call
router.query.page;
search.query();                     // no SQL argument
analyticsRepo.query(sqlVariable);   // dynamic value, not static SQL
query(dynamicSql);
```

### With options

```js
module.exports = [
  {
    plugins: { 'typeorm-enterprise': require('eslint-plugin-typeorm-enterprise') },
    rules: {
      'typeorm-enterprise/no-raw-query': [
        'error',
        {
          allowedOperations: ['SELECT'],
          allowedObjectNames: ['analyticsRepo'],
          ignorePatterns: ['**/migrations/**'],
        },
      ],
    },
  },
];
```

## 🧠 How it works

For every `CallExpression`, the rule:

1. Resolves the **callee** (`getCalleeInfo`) → method name + object name.
2. Skips unless the method is in `restrictedMethods`, and skips allow-listed objects.
3. Checks the **first argument is static SQL** (`isStaticSqlArgument`) — string literal or expression-free template literal only.
4. Extracts the text and matches the **leading SQL keyword** (`getFirstSqlOperation`).
5. Reports only if that operation is in the blocked set — after applying `allowedOperations` and `ignorePatterns`.

This static-only design is intentional: it enforces the SQL patterns it can prove, and stays quiet on everything dynamic.

## 🗺️ Roadmap

- [x] `no-raw-query` rule (static string + template literal detection)
- [x] Configurable operations / methods / object allow-lists
- [x] `ignorePatterns` glob support
- [x] Dual ESM + CJS builds with type declarations
- [x] `recommended` shareable config
- [x] CI matrix (Node 18/20/22) + automated npm publish with provenance
- [ ] `no-query-builder-injection` rule
- [ ] Autofix suggestions toward Repository / QueryBuilder APIs
- [ ] TypeScript-aware type inference for callee resolution
- [ ] Additional enterprise governance rules

## 🤝 Contributing

```bash
git clone https://github.com/alokraj68/eslint-plugin-typeorm-enterprise.git
cd eslint-plugin-typeorm-enterprise
npm install
npm run ci     # lint + typecheck + test
```

PRs welcome. Every push and PR runs the CI matrix; merges to `main` auto-publish when `package.json` version bumps.

## 📄 License

[MIT](https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/blob/main/LICENSE) © alokraj68
