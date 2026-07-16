# `require-transaction`

Require data-mutating operations to run inside a transaction callback.

> ⚠️ **Opinionated & heuristic.** This rule cannot see types, so it matches by
> method name and lexical nesting. It ships in the **`strict`** config only, not
> `recommended`.

Flags mutating calls (`save`, `remove`, `softRemove`, `recover`, `insert`,
`update`, `delete`, `upsert`) that are not lexically nested inside a
`.transaction(...)` callback.

## Examples

```js
// ❌ invalid
await manager.save(user);
repo.remove(entity);

// ✅ valid
dataSource.transaction(async (manager) => {
  await manager.save(user);
});
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `mutationMethods` | `string[]` | `save, remove, softRemove, recover, insert, update, delete, upsert` | Methods treated as mutations |
| `transactionMethods` | `string[]` | `["transaction"]` | Wrapper methods that satisfy the rule |
| `ignorePatterns` | `string[]` | `[]` | File globs to skip |
