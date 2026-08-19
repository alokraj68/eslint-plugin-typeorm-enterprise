# Changelog

All notable changes to this project are documented here. This project follows
[Semantic Versioning](https://semver.org/).

## [2.3.4] - 2026-08-19

### Security

- Cleared all three Dependabot alerts. Every one was a transitive
  **devDependency** - this package ships zero runtime dependencies, so no
  consumer was ever exposed.
  - `js-yaml` 4.3.0 -> 4.3.1 (high, GHSA-5p4m-2wfm-xmqj), via `eslint`
  - `brace-expansion` (high, GHSA-mh99-v99m-4gvg, GHSA-rgw5-rvv9-x895)
  - `esbuild` 0.27.7 -> 0.28.2 (low, GHSA-g7r4-m6w7-qqqr), via `tsup`
- The esbuild fix needed an `overrides` entry: `tsup` pins `^0.27`, so
  `npm audit fix` could not reach it. The advisory only applies to esbuild's
  dev server on Windows, which `tsup` never starts - pinned anyway, because a
  build-only tool is where an unpatched transitive dependency goes unnoticed.
  Build and all 25 tests verified against the overridden version.

## [2.3.3] - 2026-08-19

### Added

- Buy Me a Coffee alongside GitHub Sponsors. `.github/FUNDING.yml` carries both,
  and the `funding` field in `package.json` became an array so npm shows both on
  the package page rather than only the GitHub one.
- README section "Also by the author" linking
  [craftkit](https://github.com/alokraj68/craftkit) and its four packages. Same
  working principle as this plugin - a rule that matters fails the build -
  pointed at prose, page layout and resumes instead of TypeORM.

## [2.3.0] - 2026-07-27

### Added

- `AGENTS.md` — instructions for AI coding agents working in this repository
  (layout, commands, conventions). Agents read `AGENTS.md` automatically;
  `llms.txt` is a web convention and was never picked up by them. The package
  summary section is generated from `llms.txt` by `scripts/sync-agents-md.mjs`
  (`npm run doc:agents`), and CI fails on drift, so `llms.txt` stays the single
  source of truth.
- `llms.txt` is now published to GitHub Pages at a stable, fetchable URL —
  <https://alokraj68.github.io/eslint-plugin-typeorm-enterprise/llms.txt> — via
  `scripts/build-site.mjs` and the new `pages.yml` workflow. The `/llms.txt`
  convention only works over HTTP; a copy inside `node_modules` is unreachable
  to agents that fetch.
- README section "For AI coding agents" pointing at the hosted URL, the
  in-tarball copy, and a snippet consumers can paste into their own
  `AGENTS.md` / `CLAUDE.md`.
- `AGENTS.md` is included in the published tarball alongside `llms.txt`.

## [2.2.0] - 2026-07-27

### Added

- New rules enforcing strictly typed raw query results, both in the `strict`
  config and type-aware by default (`typeAware: true`):
  - `require-typed-query-result` — `query()`, `getRawMany()`, `getRawOne()`,
    `getRawAndEntities()` and `execute()` return `any`, so the call site must
    declare the row shape (type argument, variable annotation, `as` assertion,
    or the enclosing function's return type). Discarded results are not flagged.
    With type information, results that are already typed (a wrapper, a custom
    repository) are left alone.
  - `no-untyped-record-escape-hatch` — blocks the broad types that satisfy the
    rule above without declaring anything: `any`, `object`, `{}`,
    `Record<string, any>`, `Map<string, any>`, through `Promise<…>`, arrays and
    unions. `allowUnknown: true` permits `unknown` / `Record<string, unknown>`
    for genuinely dynamic pivot and aggregate queries; `extraLooseTypes` adds
    project-specific escape hatches.

  Both are strict-only on purpose: on a raw-query-heavy codebase they fire on
  nearly every call site, which is the point under `strict` but too noisy for
  `recommended`. Both also run under oxlint (covered by the smoke test with a
  TypeScript fixture): oxlint has no type-aware support, so they fall back to
  the AST-only path there.

- `require-query-runner-release` (`recommended`) — a QueryRunner holds a
  dedicated pooled connection; if it is never released, or released only on the
  happy path, a handler that leaks one per request exhausts the pool. The rule
  tracks `createQueryRunner()` results bound to a variable and requires a
  `release()` inside a `finally` in the same function, distinguishing "never
  released" (`missingRelease`) from "released outside `finally`"
  (`releaseOutsideFinally`). Options: `methods`, `releaseMethods`, `typeAware`,
  `ignorePatterns`.
- New `recommendedTypeChecked` and `strictTypeChecked` configs — the same rule
  sets as `recommended` / `strict`, with `typeAware: true` applied to every rule
  whose schema declares the option, so type-aware detection no longer has to be
  wired up rule by rule. They need the typescript-eslint parser with a project
  or `projectService`; without it the rules fall back to their AST-only paths,
  so enabling the config early is harmless.

### Fixed

- The oxlint smoke test failed on Windows: `execFileSync` cannot spawn the
  `npx.cmd` shim (EINVAL). It now runs the locally installed oxlint through its
  Node entry point, which also keeps the run offline and pinned to the
  devDependency version.

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
