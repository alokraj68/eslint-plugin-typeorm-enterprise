import { test } from 'node:test';
import { RuleTester } from 'eslint';

import plugin from '../dist/index.mjs';

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
});

test('prefer-transaction-for-multiple-writes', () => {
  ruleTester.run(
    'prefer-transaction-for-multiple-writes',
    plugin.rules['prefer-transaction-for-multiple-writes'],
    {
      valid: [
        // Single write.
        'async function f() { await repo.save(a); }',
        // Already wrapped in a transaction.
        'dataSource.transaction(async (m) => { await m.save(a); await m.remove(b); });',
        // Non-mutating calls.
        'async function f() { await repo.find(); await repo.findOne(); }',
      ],
      invalid: [
        {
          code: 'async function f() { await repo.save(a); await repo.remove(b); }',
          errors: [{ messageId: 'combine', data: { count: '2' } }],
        },
        {
          code: 'async function f() { await repo.insert(a); await repo.update(1, b); await repo.delete(2); }',
          errors: [{ messageId: 'combine', data: { count: '3' } }],
        },
      ],
    },
  );
});
