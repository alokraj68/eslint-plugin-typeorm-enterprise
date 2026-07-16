import { test } from 'node:test';
import { RuleTester } from 'eslint';

import plugin from '../dist/index.mjs';

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
});

test('require-parameterized-query', () => {
  ruleTester.run('require-parameterized-query', plugin.rules['require-parameterized-query'], {
    valid: [
      'query("SELECT * FROM users");',
      'manager.query(`DELETE FROM users`);',
      'query("SELECT * FROM " + "users");',
      'query(sql);',
      'raw(`hello ${name}`);',
      'search.query(`greeting ${name}`);',
      'req.query.id;',
      'logger.info("SELECT * FROM users WHERE id = " + id);',
      {
        code: 'analyticsRepo.query(`SELECT * FROM t WHERE id = ${id}`);',
        options: [{ allowedObjectNames: ['analyticsRepo'] }],
      },
      {
        code: 'manager.query("SELECT * FROM users WHERE id = " + id);',
        filename: 'migrations/20250101.js',
        options: [{ ignorePatterns: ['**/migrations/**'] }],
      },
    ],
    invalid: [
      {
        code: 'query(`SELECT * FROM users WHERE id = ${id}`);',
        errors: [{ messageId: 'parameterize' }],
      },
      {
        code: 'manager.query("SELECT * FROM users WHERE id = " + userId);',
        errors: [{ messageId: 'parameterize' }],
      },
      {
        code: 'db.execute(`UPDATE users SET name = ${name} WHERE id = ${id}`);',
        errors: [{ messageId: 'parameterize' }],
      },
      {
        code: 'raw("DELETE FROM users WHERE id = " + id);',
        errors: [{ messageId: 'parameterize' }],
      },
      {
        code: 'repo.query("SELECT * FROM t WHERE a = " + a + " AND b = " + b);',
        errors: [{ messageId: 'parameterize' }],
      },
    ],
  });
});
