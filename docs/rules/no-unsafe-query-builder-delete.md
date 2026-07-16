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
| `ignorePatterns` | `string[]` | `[]` | File globs to skip |
