# `no-entity-manager-query`

Disallow raw queries executed directly on a TypeORM `EntityManager`.

Flags `.query()` (configurable) called on an EntityManager — whether obtained
via `getManager()` / `getEntityManager()` or referenced through a `manager` /
`entityManager` identifier. `EntityManager.query` bypasses the repository and
query-builder layers entirely.

## Examples

```js
// ❌ invalid
manager.query('SELECT 1');
entityManager.query('SELECT 1');
getManager().query('SELECT 1');
connection.getEntityManager().query('SELECT 1');

// ✅ valid
repository.find();
qb.getMany();
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `methods` | `string[]` | `["query"]` | Methods to flag on the manager |
| `objectNames` | `string[]` | `["manager","entityManager"]` | Identifier names treated as an EntityManager |
| `typeAware` | `boolean` | `false` | Confirm the receiver by its TypeScript type instead of its name |
| `ignorePatterns` | `string[]` | `[]` | File globs to skip |

## Type-aware mode

By default the rule matches on the receiver's **name** (`manager`,
`entityManager`, or a `getManager()` / `getEntityManager()` call). With
`{ typeAware: true }` and type information available (the
[`typescript-eslint`](https://typescript-eslint.io) parser plus a configured
project or `projectService`), the receiver is confirmed by its **TypeScript
type** instead:

```js
'typeorm-enterprise/no-entity-manager-query': ['error', { typeAware: true }]
```

- An `EntityManager` under any variable name is caught (`const em = ds.manager; em.query(...)`).
- A plain object or a `Repository` that happens to be named `manager` is **not**
  flagged, removing false positives.

When no type information is available (for example under oxlint, or without a
project), the rule falls back to the name-based check automatically.
