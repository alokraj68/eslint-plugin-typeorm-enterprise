# Project Plan

Roadmap and working notes for `eslint-plugin-typeorm-enterprise`.

## Status

- [x] `no-raw-query` rule (static string + template literal detection)
- [x] Configurable operations / methods / object allow-lists
- [x] `ignorePatterns` glob support
- [x] Dual ESM + CJS builds with type declarations
- [x] `recommended` shareable config
- [x] CI matrix (Node 18/20/22) + Trusted Publishing to npm
- [x] Branch protection on `main` and `dev` + CODEOWNERS
- [x] cjs/mjs parity test
- [x] Dependabot + SECURITY policy
- [x] TypeScript version matrix (5.5, 5.x, 6.x, 7.x preview)

## Near term

- [ ] Autofix / suggestions — offer a rewrite toward QueryBuilder / Repository.
- [ ] Detect string-concatenated SQL (`'SELECT ' + x`) and tagged templates.
- [ ] Second rule: `require-parameterized-query` (flag interpolated SQL).
- [ ] `eslint-doc-generator` for auto-generated rule docs + README rule table.
- [ ] Severity-tiered configs (`recommended-error`, `recommended-warn`).

## Medium term

- [ ] Migrate rule source to TypeScript with a build step (removes the
      hand-maintained cjs/mjs/`.d.ts` drift risk).
- [ ] `@typescript-eslint` type-aware detection of TypeORM `Repository<T>`
      receivers to cut false positives/negatives.
- [ ] Additional governance rules:
  - `no-synchronize-true` (block `synchronize: true` in datasource config)
  - `require-transaction` (mutations outside a transaction)
  - `no-entity-manager-query`
- [ ] Coverage reporting + badge.

## Longer term

- [ ] Documentation site / playground.
- [ ] Performance benchmarks for the rule visitors.
- [ ] Changesets for automated changelog + version management.

## Notes

- `main`/`dev` are branch-protected; land changes via PR + owner review.
- Releases: bump `package.json` version, merge to `main`, OIDC publish fires.
- Keep the two rule builds in lockstep — `npm run test:parity` guards this.
