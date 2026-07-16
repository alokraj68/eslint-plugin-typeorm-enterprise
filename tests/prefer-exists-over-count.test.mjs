import { test } from 'node:test';
import { RuleTester } from 'eslint';

import plugin from '../dist/index.mjs';

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
});

test('prefer-exists-over-count', () => {
  ruleTester.run('prefer-exists-over-count', plugin.rules['prefer-exists-over-count'], {
    valid: [
      'const n = await repo.count();',
      'function f() { return repo.count(); }',
      'const total = qb.getCount() + 1;',
    ],
    invalid: [
      {
        code: 'if ((await repo.count()) > 0) {}',
        errors: [{ messageId: 'preferExists', data: { method: 'count' } }],
      },
      {
        code: 'const has = qb.getCount() === 0;',
        errors: [{ messageId: 'preferExists', data: { method: 'getCount' } }],
      },
      {
        code: 'if (repo.count()) {}',
        errors: [{ messageId: 'preferExists', data: { method: 'count' } }],
      },
    ],
  });
});
