import { test } from 'node:test';
import { RuleTester } from 'eslint';

import plugin from '../dist/index.mjs';

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
});

test('no-unsafe-query-builder-delete', () => {
  ruleTester.run('no-unsafe-query-builder-delete', plugin.rules['no-unsafe-query-builder-delete'], {
    valid: [
      'qb.delete().where("id = :id", { id }).execute();',
      'qb.createQueryBuilder().delete().from(User).where("id = :id").execute();',
      'qb.update(User).set({ active: false }).where("id = :id").execute();',
      'qb.select().from(User).execute();',
      'repo.save(user);',
    ],
    invalid: [
      {
        code: 'qb.delete().from(User).execute();',
        errors: [{ messageId: 'missingWhere', data: { operation: 'DELETE' } }],
      },
      {
        code: 'qb.update(User).set({ active: false }).execute();',
        errors: [{ messageId: 'missingWhere', data: { operation: 'UPDATE' } }],
      },
      {
        code: 'repo.createQueryBuilder().delete().execute();',
        errors: [{ messageId: 'missingWhere', data: { operation: 'DELETE' } }],
      },
    ],
  });
});
