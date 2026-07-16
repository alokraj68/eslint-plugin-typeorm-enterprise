# Changelog

All notable changes to this project are documented here. This project follows
[Semantic Versioning](https://semver.org/).

## [2.1.0] - 2026-07-16

### Added

- Optional **type-aware detection** across all receiver-based rules via a
  `typeAware` option: `no-raw-query`, `require-parameterized-query`,
  `no-entity-manager-query`, `no-unsafe-query-builder-delete`, and
  `no-interpolated-where`. With the typescript-eslint parser and type
  information available, calls are only flagged when the receiver's TypeScript
  type is the relevant TypeORM class (Repository / EntityManager / DataSource /
  QueryBuilder / …), removing false positives on lookalike objects and catching
  receivers under any name. Falls back to the AST-only check when no type
  information is present (including under oxlint).
- `RELEASING.md` documenting the fast-forward release process (`main` only ever
  fast-forwards to `dev`).

### Changed

- Dev dependencies: bumped `c8` to 11 and `@types/node` to 26; `typescript-eslint`
  to the latest 8.x.
- Held `eslint` at 9 and capped the `typescript` dev dependency to `<6.1`. The
  current `typescript-eslint` (8.x) does not yet support ESLint 10 or TypeScript
  6.1+, so those bumps wait on upstream. This affects the lint toolchain only —
  consumers may use the plugin under ESLint 10 (allowed by `peerDependencies`)
  and any TypeScript version (the shipped `.d.ts` is validated against 5.5–7 in CI).

## [2.0.0] - 2026-07-16

### Breaking

- The build is now published from `dist/` (compiled from a single TypeScript
  source) instead of the hand-written `lib/` files. The package root import is
  unchanged, but the per-rule subpath exports (`.../rules/no-raw-query`) have
  been removed — access rules through the plugin object instead.
- The plugin's `meta.name` is now `typeorm-enterprise` (used as the rule prefix
  by oxlint). ESLint users are unaffected — the rule prefix in ESLint comes from
  the key you register the plugin under.

### Added

- Migrated the plugin to a single TypeScript source compiled with tsup to a
  dual ESM + CommonJS bundle with type declarations.
- New rules:
  - `no-synchronize-true` (auto-fixable)
  - `no-entity-manager-query`
  - `require-transaction` (strict config)
  - `no-unsafe-query-builder-delete`
  - `no-interpolated-where`
  - `prefer-transaction-for-multiple-writes` (strict config)
  - `require-tenant-scope` (multi-tenant, configurable `tenantKeys`)
  - `prefer-exists-over-count` (performance config)
- New shareable configs: `strict`, `performance`, `multiTenant`.
- Per-rule documentation under `docs/rules/`.
- Coverage reporting (c8) and Codecov upload.
- Contributor guide, changelog, issue/PR templates.
- Verified support for running under oxlint's JS-plugin API (smoke-tested in
  CI); `meta.name` set to `typeorm-enterprise` so rule names match ESLint.
- Auto-generated README rules table with a CI drift check.
- Framework recipes under `examples/` (NestJS, Express, multi-tenant, oxlint).
- CodeQL security scanning workflow.
- Richer npm metadata (keywords, homepage, bugs, funding, provenance) and a
  slimmer published tarball (source maps excluded from the package).

## [1.1.0]

### Added

- `require-parameterized-query` rule.
- `recommended` and `warn` shareable configs.

## [1.0.0]

### Added

- Initial release with the `no-raw-query` rule and `recommended` config.
