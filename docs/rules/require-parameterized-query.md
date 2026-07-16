# `require-parameterized-query`

Require parameterized queries instead of **dynamically assembled** raw SQL.

Flags SQL built with template-literal `${...}` interpolation, or a `+`
concatenation that mixes a SQL string literal with a variable, when passed to
`query`, `execute`, or `raw`. This is the classic SQL-injection shape; use bound
parameters or the QueryBuilder instead.

## Examples

```js
// ❌ invalid
query(`SELECT * FROM users WHERE id = ${id}`);
manager.query('SELECT * FROM users WHERE id = ' + userId);
db.execute(`UPDATE users SET name = ${name}`);

// ✅ valid
query('SELECT * FROM users WHERE id = ?', [id]); // parameterized
query(sql);                                       // plain dynamic value, no SQL literal
raw(`hello ${name}`);                             // not SQL
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `restrictedMethods` | `string[]` | `["query","execute","raw"]` | Methods to inspect |
| `allowedObjectNames` | `string[]` | `[]` | Objects allowed to run raw SQL |
| `typeAware` | `boolean` | `false` | Only flag when the receiver is a TypeORM type (requires type info) |
| `ignorePatterns` | `string[]` | `[]` | File globs to skip |

`typeAware` narrows member calls to TypeORM receivers when type information is
available, falling back to the name-based check otherwise. See
[type-aware mode](./no-entity-manager-query.md#type-aware-mode).
