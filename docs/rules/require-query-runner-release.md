# `require-query-runner-release`

Require a QueryRunner to be released in a `finally` block.

`dataSource.createQueryRunner()` takes a dedicated connection out of the pool.
If it is never released the connection never comes back, and a request handler
that leaks one per call exhausts the pool and takes the service down — usually
under load, long after the code shipped.

Releasing at the end of the happy path is not enough: a thrown query is exactly
the case that leaks. The release has to sit in a `finally`.

The rule tracks `createQueryRunner()` results assigned to a variable and looks
for `<name>.release()` inside a `finally` block in the same function.

Enabled by the `recommended` config.

## Examples

```ts
// ❌ invalid — never released
const queryRunner = dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.manager.save(user);

// ❌ invalid — released only on success
async function save(user: User) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.startTransaction();
  await queryRunner.manager.save(user);
  await queryRunner.commitTransaction();
  await queryRunner.release(); // skipped when save() throws
}

// ✅ valid
async function save(user: User) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    await queryRunner.manager.save(user);
    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

A runner that is not bound to a variable (`ds.createQueryRunner().connect()`)
is not tracked — there is no name to follow.

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `methods` | `string[]` | `["createQueryRunner"]` | Factory methods that hand out a QueryRunner |
| `releaseMethods` | `string[]` | `["release"]` | Methods that count as releasing it |
| `typeAware` | `boolean` | `false` | Confirm the factory's receiver by its TypeScript type (`DataSource`, `Connection`, `EntityManager`) |
| `ignorePatterns` | `string[]` | `[]` | File globs to skip |

## Messages

| Message | When |
|---|---|
| `missingRelease` | No `release()` call for that runner anywhere in the function |
| `releaseOutsideFinally` | A `release()` exists but not in a `finally` block |

## Type-aware mode

`createQueryRunner` is a distinctive name, so the AST-only check is already
precise and `typeAware` defaults to `false`. With
[`typescript-eslint`](https://typescript-eslint.io) and type information
available, `{ typeAware: true }` additionally confirms the receiver really is a
TypeORM `DataSource` / `Connection` / `EntityManager` before reporting. It is
enabled for you by the `strictTypeChecked` and `recommendedTypeChecked` configs.
