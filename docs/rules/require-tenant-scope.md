# `require-tenant-scope`

Require tenant-scoped access on TypeORM read and write operations. For
multi-tenant applications, this catches queries that forget to filter by the
current tenant — a cross-tenant data-leak risk.

> ⚠️ **Project-specific & heuristic.** Not in `recommended`. Enable it via the
> `multiTenant` config or directly, and set `tenantKeys` to match your schema.

The rule flags a configured read/write call whose source text does not reference
any of the configured tenant keys.

## Examples

With the default keys (`tenantId`, `tenant_id`, `organizationId`, `organization_id`, `orgId`):

```js
// ❌ invalid
repo.find({ where: { name } });
repo.delete({ id });

// ✅ valid
repo.find({ where: { tenantId, name } });
repo.findOne({ where: { organizationId } });
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `tenantKeys` | `string[]` | `tenantId, tenant_id, organizationId, organization_id, orgId` | Tenant identifiers to require |
| `methods` | `string[]` | `find, findOne, findOneBy, findAndCount, findBy, update, delete, softDelete, remove, count` | Methods to check |
| `ignorePatterns` | `string[]` | `[]` | File globs to skip |

### Custom tenant keys

```js
'typeorm-enterprise/require-tenant-scope': ['error', { tenantKeys: ['companyId'] }]
```
