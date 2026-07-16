# Changelog

All notable changes to this project are documented here. This project follows
[Semantic Versioning](https://semver.org/).

## [Unreleased]

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
