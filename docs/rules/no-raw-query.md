# `no-raw-query`

Disallow **static** raw SQL passed to TypeORM query helpers and raw SQL methods.

The rule inspects the **first argument** of calls to `query`, `execute`, and
`raw` for string literals and expression-free template literals whose text
begins with a SQL keyword. Dynamic values are ignored here (see
[`require-parameterized-query`](./require-parameterized-query.md)).

**Detected operations:** `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `WITH`,
`ALTER`, `DROP`, `CREATE`, `TRUNCATE`.

## Examples

```js
// ❌ invalid
repo.query('SELECT * FROM users');
manager.query(`DELETE FROM users`);

// ✅ valid
req.query.id;
analyticsRepo.query(sqlVariable);
search.query('not SQL text');
```

## Options

An options object as the second element:

| Option | Type | Default | Description |
|---|---|---|---|
| `restrictedOperations` | `string[]` | all supported | SQL operations to block |
| `allowedOperations` | `string[]` | `[]` | Operations to permit (overrides restricted) |
| `restrictedMethods` | `string[]` | `["query","execute","raw"]` | Methods to inspect |
| `allowedObjectNames` | `string[]` | `[]` | Objects allowed to run raw SQL |
| `ignorePatterns` | `string[]` | `[]` | File globs to skip |

```js
'typeorm-enterprise/no-raw-query': ['error', {
  allowedOperations: ['SELECT'],
  allowedObjectNames: ['analyticsRepo'],
  ignorePatterns: ['**/migrations/**'],
}]
```
