# Contributing

Thanks for your interest in improving `eslint-plugin-typeorm-enterprise`.

## Getting started

```bash
git clone https://github.com/alokraj68/eslint-plugin-typeorm-enterprise.git
cd eslint-plugin-typeorm-enterprise
npm install
npm run ci   # lint + typecheck + build + test
```

Enable the version-bump hook once per clone:

```bash
git config core.hooksPath .githooks
```

## Project layout

- `src/rules/*.ts` — one file per rule (TypeScript).
- `src/index.ts` — registers rules and builds the shareable configs.
- `src/utils/ast.ts` — shared helpers.
- `tests/*.test.mjs` — `node --test` + `RuleTester`, run against the built bundle.
- `docs/rules/*.md` — one doc per rule.

The plugin is compiled with tsup into `dist/` (ESM + CJS + `.d.ts`).

## Adding a rule

1. Create `src/rules/<name>.ts` (default-export a `Rule.RuleModule`).
2. Register it in `src/index.ts` and pick which config(s) it belongs to.
3. Add `tests/<name>.test.mjs`.
4. Add `docs/rules/<name>.md`.
5. Run `npm run doc` to refresh the README rules table, then `npm run ci`.

Rules are AST-only (no type information) so they work in any ESLint 9 setup
without parser configuration.

## Pull requests

- Every push and PR runs the CI matrix (Node 18/20/22 · TypeScript 5.5–7).
- `main` and `dev` are protected: changes land via PR with owner review.
- Keep commits focused with clear, imperative messages.

## Reporting bugs

Use the issue templates. A minimal ESLint config plus a code sample that
reproduces the false positive/negative is the fastest path to a fix. For
security issues, see [SECURITY.md](./SECURITY.md).
