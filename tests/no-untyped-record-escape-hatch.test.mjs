import { test } from 'node:test';
import { RuleTester } from 'eslint';
import { join } from 'node:path';
import tseslint from 'typescript-eslint';

import plugin from '../dist/index.mjs';

const ruleTester = new RuleTester({
  languageOptions: { parser: tseslint.parser, parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
});

const opts = [{ typeAware: false }];
const v = (code) => ({ code, options: opts });
const e = (code, method) => ({
  code,
  options: opts,
  errors: [{ messageId: 'looseResultType', data: { method } }],
});

test('no-untyped-record-escape-hatch', () => {
  ruleTester.run(
    'no-untyped-record-escape-hatch',
    plugin.rules['no-untyped-record-escape-hatch'],
    {
      valid: [
        v("const rows = await repo.query<UserRow[]>('SELECT 1');"),
        v("const counts: Record<string, number> = await repo.query('SELECT 1');"),
        v("const row: { id: number } = await repo.query('SELECT 1');"),
        v("const rows: Promise<UserRow[]> = repo.query('SELECT 1');"),
        v("const rows: Array<UserRow> = await repo.query('SELECT 1');"),
        v("const rows: ns.UserRow = await repo.query('SELECT 1');"),
        v("const rows: UserRow & Timestamped = await repo.query('SELECT 1');"),
        v("const rows: 'a' | 'b' = await repo.query('SELECT 1');"),
        // Not a query-result call site.
        v("const rows = query<any[]>('SELECT 1');"),
        v("const rows = repo['query']<any[]>('SELECT 1');"),
        // Nesting past the recursion guard stops the walk rather than guessing.
        v("const rows: Promise<Array<Promise<Array<Promise<Array<Promise<any>>>>>>> = repo.query('SELECT 1');"),
        // Untyped entirely — that is require-typed-query-result's job.
        v("const rows = await repo.query('SELECT 1');"),
        // Not a TypeORM receiver by name.
        v("const rows = await redis.query<any[]>('SELECT 1');"),
        {
          code: "const rows: Record<string, unknown>[] = await repo.query('SELECT 1');",
          options: [{ typeAware: false, allowUnknown: true }],
        },
        {
          code: "const rows: unknown = await repo.query('SELECT 1');",
          options: [{ typeAware: false, allowUnknown: true }],
        },
        {
          code: "const rows: any = await repo.query('SELECT 1');",
          filename: join(process.cwd(), 'src', 'migrations', '1700000000-init.ts'),
          options: [{ typeAware: false, ignorePatterns: ['**/migrations/**'] }],
        },
        {
          code: "const rows: any = await repo.query('SELECT 1');",
          options: [{ typeAware: false, methods: ['getRawMany'] }],
        },
        {
          code: "const rows: any = await db.query('SELECT 1');",
          options: [{ typeAware: false, receiverNames: ['repo'] }],
        },
      ],
      invalid: [
        e("const rows = await repo.query<any[]>('SELECT 1');", 'query'),
        e("const rows: Record<string, any>[] = await repo.query('SELECT 1');", 'query'),
        e("const rows: object = await repo.query('SELECT 1');", 'query'),
        e("const rows: {} = await repo.query('SELECT 1');", 'query'),
        e("const rows: Record<string, unknown> = await repo.query('SELECT 1');", 'query'),
        e('const rows = (await qb.getRawMany()) as Map<string, any>;', 'getRawMany'),
        e("const rows: UserRow[] | any = await manager.query('SELECT 1');", 'query'),
        e("const rows: Promise<Record<string, any>> = repo.query('SELECT 1');", 'query'),
        e("const rows: Array<any> = await repo.query('SELECT 1');", 'query'),
        // A bare `Record` / `Map` with no value type is just as loose.
        e("const rows: Record = await repo.query('SELECT 1');", 'query'),
        e("const rows: UserRow & object = await repo.query('SELECT 1');", 'query'),
        e("const rows = await repo.query('SELECT 1') as any;", 'query'),
        e("function f(): Record<string, any> { return repo.query('SELECT 1'); }", 'query'),
        // Default options (typeAware on) with no type information available.
        {
          code: "const rows: any = await repo.query('SELECT 1');",
          errors: [{ messageId: 'looseResultType', data: { method: 'query' } }],
        },
        {
          code: "const rows: JsonObject = await repo.query('SELECT 1');",
          options: [{ typeAware: false, extraLooseTypes: ['JsonObject'] }],
          errors: [{ messageId: 'looseResultType', data: { method: 'query' } }],
        },
      ],
    },
  );
});
