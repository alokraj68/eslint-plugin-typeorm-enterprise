# `no-synchronize-true`

Disallow enabling `synchronize: true` in TypeORM data source configuration.

🔧 This rule is **auto-fixable** — it rewrites `true` to `false`.

Schema auto-synchronization alters the database schema on every app start and
can silently drop columns and data. Production schemas should evolve through
migrations, never `synchronize`.

## Examples

```js
// ❌ invalid  (auto-fixed to `synchronize: false`)
new DataSource({ type: 'postgres', synchronize: true });

// ✅ valid
new DataSource({ type: 'postgres', synchronize: false });
new DataSource({ type: 'postgres', synchronize: isDev });
```

## Options

None.
