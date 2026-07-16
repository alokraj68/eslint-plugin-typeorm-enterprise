# `prefer-transaction-for-multiple-writes`

Suggest combining multiple write operations into a single transaction.

> ⚠️ **Opinionated & heuristic** (no type info). Ships in the **`strict`** config
> only.

When a function performs two or more mutating operations (`save`, `remove`,
`insert`, `update`, `delete`, ...) outside a transaction, they can partially
succeed and leave inconsistent state. This rule asks you to wrap them in a
single `dataSource.transaction(...)` so they commit or roll back together.

## Examples

```js
// ❌ invalid
async function transfer() {
  await accounts.update(from, { balance: a });
  await accounts.update(to, { balance: b });
}

// ✅ valid
async function transfer() {
  await dataSource.transaction(async (manager) => {
    await manager.update(Account, from, { balance: a });
    await manager.update(Account, to, { balance: b });
  });
}
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `mutationMethods` | `string[]` | `save, remove, softRemove, recover, insert, update, delete, upsert` | Methods treated as mutations |
| `transactionMethods` | `string[]` | `["transaction"]` | Wrapper methods that satisfy the rule |
| `threshold` | `integer` | `2` | Minimum mutations per function before reporting |
| `ignorePatterns` | `string[]` | `[]` | File globs to skip |
