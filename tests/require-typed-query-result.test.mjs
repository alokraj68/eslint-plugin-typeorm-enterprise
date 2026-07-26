import { test } from 'node:test';
import { RuleTester } from 'eslint';
import { join } from 'node:path';
import tseslint from 'typescript-eslint';

import plugin from '../dist/index.mjs';

const ignoredFile = join(process.cwd(), 'src', 'migrations', '1700000000-init.ts');

// Syntactic mode: no type information, so the receiver-name fallback applies.
const ruleTester = new RuleTester({
  languageOptions: { parser: tseslint.parser, parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
});

const opts = [{ typeAware: false }];
const v = (code) => ({ code, options: opts });
const e = (code, method) => ({
  code,
  options: opts,
  errors: [{ messageId: 'missingResultType', data: { method } }],
});

test('require-typed-query-result', () => {
  ruleTester.run('require-typed-query-result', plugin.rules['require-typed-query-result'], {
    valid: [
      v("const rows = await repo.query<UserRow[]>('SELECT 1');"),
      v("const rows: UserRow[] = await repo.query('SELECT 1');"),
      v("const rows = (await qb.getRawMany()) as UserRow[];"),
      v("async function f(): Promise<UserRow[]> { return repo.query('SELECT 1'); }"),
      // Result discarded: no shape to declare.
      v("await manager.query('UPDATE users SET active = true');"),
      // Not a TypeORM receiver by name.
      v("const rows = await redis.query('SELECT 1');"),
      // Mapped-entity APIs are already typed by the entity.
      v('const users = await repo.find();'),
      // Bare call and computed member access: no resolvable method name.
      v("const rows = query('SELECT 1');"),
      v("const rows = repo['query']('SELECT 1');"),
      // Receiver chains that do not root in a known name.
      v("const rows = await new Client().query('SELECT 1');"),
      v("const rows = await (await getRepo()).query('SELECT 1');"),
      {
        code: "const rows = await repo.query('SELECT 1');",
        filename: ignoredFile,
        options: [{ typeAware: false, ignorePatterns: ['**/migrations/**'] }],
      },
      // Custom method list.
      {
        code: "const rows = await repo.query('SELECT 1');",
        options: [{ typeAware: false, methods: ['getRawMany'] }],
      },
      // Custom receiver list.
      {
        code: "const rows = await db.query('SELECT 1');",
        options: [{ typeAware: false, receiverNames: ['repo'] }],
      },
    ],
    invalid: [
      e("const rows = await repo.query('SELECT 1');", 'query'),
      e('const rows = await qb.getRawMany();', 'getRawMany'),
      e('const row = await queryBuilder.getRawOne();', 'getRawOne'),
      e("const rows = await repo.createQueryBuilder('u').getRawMany();", 'getRawMany'),
      e("function f() { return manager.query('SELECT 1'); }", 'query'),
      // Receiver reached through a property chain and through `await`.
      e("const rows = await this.repo.query('SELECT 1');", 'query'),
      e("const rows = (await repo.query('SELECT 1'))!;", 'query'),
      // A function whose return type is declared elsewhere than the call site
      // does not count when the arrow has no annotation.
      e("const load = async () => repo.query('SELECT 1');", 'query'),
      // Return nested inside a block: the walk still finds the function.
      e("function f(flag) { if (flag) { return repo.query('SELECT 1'); } }", 'query'),
      // Default options (typeAware on) with no type information available:
      // falls back to the syntactic check.
      {
        code: "const rows = await repo.query('SELECT 1');",
        errors: [{ messageId: 'missingResultType', data: { method: 'query' } }],
      },
      {
        code: "const rows = await db.query('SELECT 1');",
        options: [{ typeAware: false, receiverNames: ['db'] }],
        errors: [{ messageId: 'missingResultType', data: { method: 'query' } }],
      },
    ],
  });
});
