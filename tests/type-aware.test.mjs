import { test } from 'node:test';
import { RuleTester } from 'eslint';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import tseslint from 'typescript-eslint';

import plugin from '../dist/index.mjs';

const fixtures = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'type-aware');

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

test('no-entity-manager-query typeAware', () => {
  ruleTester.run('no-entity-manager-query', plugin.rules['no-entity-manager-query'], {
    valid: [
      // A plain object named `manager` is NOT a TypeORM EntityManager, so with
      // type info the type-aware check does not flag it (the name-based check
      // would have a false positive here).
      {
        code: "const manager = { query(_s) {} }; manager.query('SELECT 1');",
        filename: join(fixtures, 'a.ts'),
        options: [{ typeAware: true }],
      },
      // A Repository is not an EntityManager.
      {
        code: "import { DataSource } from './typeorm'; declare const ds: DataSource; const r = ds.getRepository(Object); r.query('SELECT 1');",
        filename: join(fixtures, 'b.ts'),
        options: [{ typeAware: true }],
      },
    ],
    invalid: [
      // Typed EntityManager under a non-standard variable name is caught by type.
      {
        code: "import { DataSource } from './typeorm'; declare const ds: DataSource; const em = ds.manager; em.query('SELECT 1');",
        filename: join(fixtures, 'c.ts'),
        options: [{ typeAware: true }],
        errors: [{ messageId: 'noEntityManagerQuery', data: { method: 'query' } }],
      },
      // getManager() factory is still caught regardless of type info.
      {
        code: "import { getManager } from './typeorm'; getManager().query('SELECT 1');",
        filename: join(fixtures, 'd.ts'),
        options: [{ typeAware: true }],
        errors: [{ messageId: 'noEntityManagerQuery', data: { method: 'query' } }],
      },
    ],
  });
});
