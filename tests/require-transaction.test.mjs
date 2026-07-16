import { test } from 'node:test';
import { RuleTester } from 'eslint';

import plugin from '../dist/index.mjs';

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
});

test('require-transaction', () => {
  ruleTester.run('require-transaction', plugin.rules['require-transaction'], {
    valid: [
      // Wrapped in a transaction callback.
      'dataSource.transaction(async (manager) => { await manager.save(user); });',
      'repo.transaction(() => { entity.remove(); });',
      // Not a mutating method.
      'repository.find();',
      'user.toString();',
    ],
    invalid: [
      {
        code: 'await manager.save(user);',
        errors: [{ messageId: 'requireTransaction', data: { method: 'save' } }],
      },
      {
        code: 'repo.remove(entity);',
        errors: [{ messageId: 'requireTransaction', data: { method: 'remove' } }],
      },
      {
        code: 'await repository.update(1, { name: "x" });',
        errors: [{ messageId: 'requireTransaction', data: { method: 'update' } }],
      },
    ],
  });
});
