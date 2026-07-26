# `no-untyped-record-escape-hatch`

Disallow typing raw TypeORM query results with escape hatches such as `any`,
`object` or `Record<string, any>`.

[`require-typed-query-result`](./require-typed-query-result.md) forces a type to
be declared. This rule makes that type mean something: `query<any[]>(...)` or
`const rows: Record<string, any>[] = ...` satisfies the first rule while giving
up every guarantee it was meant to buy.

Broad types are detected through `Promise<...>`, arrays and unions.

Enabled by the `strict` config.

## Examples

```ts
// ❌ invalid
const rows = await repo.query<any[]>('SELECT id FROM users');
const rows2: Record<string, any>[] = await repo.query('SELECT id FROM users');
const rows3 = (await qb.getRawMany()) as Map<string, any>;
const rows4: object = await repo.query('SELECT id FROM users');
const rows5: {} = await repo.query('SELECT id FROM users');

// ✅ valid
interface UserRow { id: number }

const rows = await repo.query<UserRow[]>('SELECT id FROM users');
const counts: Record<string, number> = await repo.query('SELECT ...');
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `methods` | `string[]` | `["query","getRawMany","getRawOne","getRawAndEntities","execute"]` | Methods whose declared result type is checked |
| `receiverNames` | `string[]` | see [`require-typed-query-result`](./require-typed-query-result.md) | Identifier names treated as a TypeORM receiver when no type information is available |
| `allowUnknown` | `boolean` | `false` | Permit `unknown` and `Record<string, unknown>` |
| `extraLooseTypes` | `string[]` | `[]` | Extra type names to treat as an escape hatch, e.g. `["JsonObject","AnyRow"]` |
| `typeAware` | `boolean` | `true` | Use TypeScript type information to confirm the receiver |
| `ignorePatterns` | `string[]` | `[]` | File globs to skip |

### `allowUnknown`

Dynamic pivot and aggregate queries genuinely have no static row shape, and
`Record<string, unknown>` is the correct type for them — it still forces callers
to narrow before use. Teams that hit those cases regularly should set
`allowUnknown: true` rather than disabling the rule:

```js
'typeorm-enterprise/no-untyped-record-escape-hatch': ['error', { allowUnknown: true }]
```

`any` remains blocked either way.

## Type-aware mode

The escape-hatch check itself is syntactic — it reads the type the developer
wrote. `typeAware` (default `true`) only decides how the **receiver** is
identified: by its TypeScript type when type information is available, by the
`receiverNames` list otherwise.
