# `prefer-exists-over-count`

Prefer an existence check over counting rows when only presence matters.

> 🚀 Performance rule. Ships in the **`performance`** config (as a warning).

Counting scans every matching row; an existence check can stop at the first
match. When a `count()` / `getCount()` result is only compared with `0`/`1` or
used as a boolean, use `.exists()` (or a `LIMIT 1` lookup) instead.

## Examples

```js
// ❌ invalid
if ((await repo.count()) > 0) { /* ... */ }
const has = qb.getCount() === 0;

// ✅ valid
if (await repo.exists({ where: { id } })) { /* ... */ }
const total = await repo.count(); // used as an actual count
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `methods` | `string[]` | `["count","getCount","getManyAndCount"]` | Methods treated as counts |
| `ignorePatterns` | `string[]` | `[]` | File globs to skip |
