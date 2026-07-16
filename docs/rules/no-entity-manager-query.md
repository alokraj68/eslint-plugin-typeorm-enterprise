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
| `ignorePatterns` | `string[]` | `[]` | File globs to skip |
