# `no-unsafe-query-builder-delete`

Disallow QueryBuilder `delete` / `update` chains that reach `.execute()` without
a `.where()` clause. Such a chain mutates **every row** in the table — a classic
production accident.

## Examples

```js
// ❌ invalid
qb.delete().from(User).execute();
qb.update(User).set({ active: false }).execute();

// ✅ valid
qb.delete().from(User).where('id = :id', { id }).execute();
qb.update(User).set({ active: false }).where('id = :id', { id }).execute();
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `typeAware` | `boolean` | `false` | Only flag when the `.execute()` receiver is a TypeORM QueryBuilder (requires type info) |
| `ignorePatterns` | `string[]` | `[]` | File globs to skip |

With `{ typeAware: true }` and type information, the chain is only flagged when
its `.execute()` receiver is a TypeORM QueryBuilder, falling back to the
AST-only check otherwise. See
[type-aware mode](./no-entity-manager-query.md#type-aware-mode).
