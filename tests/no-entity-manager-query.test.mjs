import { test } from 'node:test';
import { RuleTester } from 'eslint';

import plugin from '../dist/index.mjs';

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
});

test('no-entity-manager-query', () => {
  ruleTester.run('no-entity-manager-query', plugin.rules['no-entity-manager-query'], {
    valid: [
      'repository.find();',
      'qb.getMany();',
      'manager.save(user);',
      'req.query.id;',
      'other.query("SELECT 1");',
      {
        code: 'manager.query("SELECT 1");',
        options: [{ objectNames: ['entityManager'] }],
      },
    ],
    invalid: [
      {
        code: 'manager.query("SELECT 1");',
        errors: [{ messageId: 'noEntityManagerQuery', data: { method: 'query' } }],
      },
      {
        code: 'entityManager.query("SELECT 1");',
        errors: [{ messageId: 'noEntityManagerQuery', data: { method: 'query' } }],
      },
      {
        code: 'getManager().query("SELECT 1");',
        errors: [{ messageId: 'noEntityManagerQuery', data: { method: 'query' } }],
      },
      {
        code: 'connection.getEntityManager().query("SELECT 1");',
        errors: [{ messageId: 'noEntityManagerQuery', data: { method: 'query' } }],
      },
    ],
  });
});
