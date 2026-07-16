# `no-interpolated-where`

Disallow interpolated or concatenated strings in QueryBuilder `where` clauses.
Building a condition from `${...}` interpolation or `+` concatenation is an
injection vector — use bound parameters.

## Examples

```js
// ❌ invalid
qb.where(`id = ${id}`);
qb.andWhere('id = ' + id);
qb.having(`count > ${n}`);

// ✅ valid
qb.where('id = :id', { id });
qb.andWhere('name = :name', { name });
qb.where(condition);
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `methods` | `string[]` | `["where","andWhere","orWhere","having"]` | Methods to inspect |
| `ignorePatterns` | `string[]` | `[]` | File globs to skip |
