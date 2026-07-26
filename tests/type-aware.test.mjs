import { test } from 'node:test';
import { RuleTester } from 'eslint';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import tseslint from 'typescript-eslint';

import plugin from '../dist/index.mjs';

const fixtures = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'type-aware');
// One virtual filename for every case so only a single file matches the default
// project (typescript-eslint caps that at 8).
const file = join(fixtures, 'file.ts');

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      projectService: {
        allowDefaultProject: ['*.ts'],
        defaultProject: 'tsconfig.json',
      },
      tsconfigRootDir: fixtures,
    },
  },
});

const t = (code) => ({ code, filename: file, options: [{ typeAware: true }] });
const tErr = (code, errors) => ({ code, filename: file, options: [{ typeAware: true }], errors });

test('no-entity-manager-query typeAware', () => {
  ruleTester.run('no-entity-manager-query', plugin.rules['no-entity-manager-query'], {
    valid: [
      t("const manager = { query(_s) {} }; manager.query('SELECT 1');"),
      t("import { DataSource } from './typeorm'; declare const ds: DataSource; const r = ds.getRepository(Object); r.query('SELECT 1');"),
    ],
    invalid: [
      tErr(
        "import { DataSource } from './typeorm'; declare const ds: DataSource; const em = ds.manager; em.query('SELECT 1');",
        [{ messageId: 'noEntityManagerQuery', data: { method: 'query' } }],
      ),
      tErr(
        "import { getManager } from './typeorm'; getManager().query('SELECT 1');",
        [{ messageId: 'noEntityManagerQuery', data: { method: 'query' } }],
      ),
    ],
  });
});

test('no-raw-query typeAware', () => {
  ruleTester.run('no-raw-query', plugin.rules['no-raw-query'], {
    valid: [
      t("declare const redis: { query(s: string): void }; redis.query('SELECT * FROM users');"),
    ],
    invalid: [
      tErr(
        "import { DataSource } from './typeorm'; declare const ds: DataSource; const repo = ds.getRepository(Object); repo.query('SELECT * FROM users');",
        [{ messageId: 'forbidden', data: { operation: 'SELECT' } }],
      ),
    ],
  });
});

test('require-parameterized-query typeAware', () => {
  ruleTester.run('require-parameterized-query', plugin.rules['require-parameterized-query'], {
    valid: [
      t("declare const redis: { query(s: string): void }; declare const id: number; redis.query(`SELECT * FROM users WHERE id = ${id}`);"),
    ],
    invalid: [
      tErr(
        "import { DataSource } from './typeorm'; declare const ds: DataSource; declare const id: number; const repo = ds.getRepository(Object); repo.query(`SELECT * FROM users WHERE id = ${id}`);",
        [{ messageId: 'parameterize' }],
      ),
    ],
  });
});

test('no-unsafe-query-builder-delete typeAware', () => {
  ruleTester.run('no-unsafe-query-builder-delete', plugin.rules['no-unsafe-query-builder-delete'], {
    valid: [
      t("declare const qb: { delete(): any; from(t: any): any; execute(): any }; qb.delete().from(Object).execute();"),
    ],
    invalid: [
      tErr(
        "import { DataSource } from './typeorm'; declare const ds: DataSource; const repo = ds.getRepository(Object); repo.createQueryBuilder().delete().from(Object).execute();",
        [{ messageId: 'missingWhere', data: { operation: 'DELETE' } }],
      ),
    ],
  });
});

test('require-typed-query-result typeAware', () => {
  ruleTester.run('require-typed-query-result', plugin.rules['require-typed-query-result'], {
    valid: [
      // Non-TypeORM receiver named like one.
      t("declare const repo: { query(s: string): Promise<string[]> }; const rows = await repo.query('SELECT 1');"),
      t("import { DataSource } from './typeorm'; declare const ds: DataSource; const repo = ds.getRepository(Object); const rows: { id: number }[] = await repo.query('SELECT 1');"),
      t("import { DataSource } from './typeorm'; declare const ds: DataSource; const repo = ds.getRepository(Object); const rows = await repo.query<{ id: number }[]>('SELECT 1');"),
      // A custom repository that already returns a typed row needs no
      // annotation at the call site.
      t("import { TypedRepository } from './typeorm'; declare const repo: TypedRepository; const rows = await repo.query('SELECT 1');"),
    ],
    invalid: [
      tErr(
        "import { DataSource } from './typeorm'; declare const ds: DataSource; const anything = ds.manager; const rows = await anything.query('SELECT 1');",
        [{ messageId: 'missingResultType', data: { method: 'query' } }],
      ),
      tErr(
        "import { DataSource } from './typeorm'; declare const ds: DataSource; const rows = await ds.getRepository(Object).createQueryBuilder('u').getRawMany();",
        [{ messageId: 'missingResultType', data: { method: 'getRawMany' } }],
      ),
    ],
  });
});

test('no-untyped-record-escape-hatch typeAware', () => {
  ruleTester.run(
    'no-untyped-record-escape-hatch',
    plugin.rules['no-untyped-record-escape-hatch'],
    {
      valid: [
        t("declare const repo: { query<T>(s: string): Promise<T> }; const rows = await repo.query<any[]>('SELECT 1');"),
      ],
      invalid: [
        tErr(
          "import { DataSource } from './typeorm'; declare const ds: DataSource; const anything = ds.manager; const rows: Record<string, any>[] = await anything.query('SELECT 1');",
          [{ messageId: 'looseResultType', data: { method: 'query' } }],
        ),
      ],
    },
  );
});

test('require-query-runner-release typeAware', () => {
  ruleTester.run('require-query-runner-release', plugin.rules['require-query-runner-release'], {
    valid: [
      // Lookalike factory on a non-TypeORM object.
      t('declare const pool: { createQueryRunner(): { connect(): void } }; const qr = pool.createQueryRunner(); qr.connect();'),
      t("import { DataSource } from './typeorm'; declare const ds: DataSource; const qr = ds.createQueryRunner(); try { await qr.connect(); } finally { await qr.release(); }"),
    ],
    invalid: [
      tErr(
        "import { DataSource } from './typeorm'; declare const ds: DataSource; const qr = ds.createQueryRunner(); await qr.connect();",
        [{ messageId: 'missingRelease', data: { method: 'createQueryRunner', name: 'qr' } }],
      ),
    ],
  });
});

test('no-interpolated-where typeAware', () => {
  ruleTester.run('no-interpolated-where', plugin.rules['no-interpolated-where'], {
    valid: [
      t("declare const qb: { where(s: string): any }; declare const id: number; qb.where(`id = ${id}`);"),
    ],
    invalid: [
      tErr(
        "import { DataSource } from './typeorm'; declare const ds: DataSource; declare const id: number; const repo = ds.getRepository(Object); repo.createQueryBuilder().where(`id = ${id}`);",
        [{ messageId: 'parameterizeWhere' }],
      ),
    ],
  });
});
