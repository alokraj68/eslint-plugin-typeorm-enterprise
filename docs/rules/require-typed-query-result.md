# `require-typed-query-result`

Require raw TypeORM query results to be explicitly typed.

`query()`, `getRawMany()`, `getRawOne()`, `getRawAndEntities()` and `execute()`
all return `any`. An untyped call site spreads that `any` through every consumer
downstream, so property typos, renamed columns and shape changes stop being
compile errors.

The rule is satisfied by any of: a call type argument, a variable type
annotation, an `as` assertion, or the enclosing function's return type.
Results that are discarded entirely (`await repo.query('UPDATE ...')` as a
statement) are not flagged — there is no shape to declare.

Enabled by the `strict` config.

## Examples

```ts
// ❌ invalid
const rows = await repo.query('SELECT id, email FROM users');
const raw = await qb.getRawMany();

// ✅ valid
interface UserRow { id: number; email: string }

const rows = await repo.query<UserRow[]>('SELECT id, email FROM users');
const rows2: UserRow[] = await repo.query('SELECT id, email FROM users');
const raw = (await qb.getRawMany()) as UserRow[];

// no result consumed — not flagged
await repo.query('UPDATE users SET active = true');
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `methods` | `string[]` | `["query","getRawMany","getRawOne","getRawAndEntities","execute"]` | Methods whose result must be typed |
| `receiverNames` | `string[]` | `["manager","entityManager","em","repo","repository","qb","queryBuilder","dataSource","ds","connection","queryRunner"]` | Identifier names treated as a TypeORM receiver when no type information is available |
| `typeAware` | `boolean` | `true` | Use TypeScript type information to confirm the receiver and the result type |
| `ignorePatterns` | `string[]` | `[]` | File globs to skip |

## Type-aware mode

Unlike the other rules in this plugin, `typeAware` defaults to **`true`** here —
without type information the check is purely syntactic and cannot tell a real
TypeORM receiver from any other object with a `query()` method.

With the [`typescript-eslint`](https://typescript-eslint.io) parser and a
configured project or `projectService`:

- The receiver is confirmed by its **TypeScript type**, so unrelated
  `.query()` calls are not flagged and a TypeORM receiver under any variable
  name is caught.
- The **inferred result type** is checked, so a wrapper or a custom repository
  method that already returns a typed row is left alone even without an
  annotation at the call site.

Without type information the rule falls back to the receiver-name list and the
syntactic check automatically.

## Related

- [`no-untyped-record-escape-hatch`](./no-untyped-record-escape-hatch.md) —
  blocks the broad types (`any`, `Record<string, any>`) that would otherwise
  satisfy this rule without declaring a real shape. Enable both together.
