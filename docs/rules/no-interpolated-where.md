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
| `typeAware` | `boolean` | `false` | Only flag when the receiver is a TypeORM QueryBuilder (requires type info) |
| `ignorePatterns` | `string[]` | `[]` | File globs to skip |

`typeAware` narrows to TypeORM QueryBuilder receivers when type information is
available, falling back to the AST-only check otherwise. See
[type-aware mode](./no-entity-manager-query.md#type-aware-mode).
