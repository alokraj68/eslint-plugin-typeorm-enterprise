import assert from 'node:assert/strict';
import { RuleTester } from 'eslint';

import cjsRule from '../lib/rules/no-raw-query.cjs';
import mjsRule from '../lib/rules/no-raw-query.mjs';

// The package ships two builds of the same rule (CommonJS + ESM). They are
// maintained by hand and can silently drift. This test fails loudly the moment
// their metadata or runtime behavior diverges.

// 1. Metadata must be identical.
assert.deepStrictEqual(
  cjsRule.meta,
  mjsRule.meta,
  'rule.meta differs between the .cjs and .mjs builds',
);

// 2. Both must expose a create function.
assert.equal(typeof cjsRule.create, 'function', '.cjs build is missing create()');
assert.equal(typeof mjsRule.create, 'function', '.mjs build is missing create()');

// 3. Identical fixtures must behave identically in both builds.
const fixtures = {
  valid: [
    'req.query.id;',
    'router.query.page;',
    'search.query();',
    'analyticsRepo.query(sqlVariable);',
    'query(dynamicSql);',
    'db.execute(variable);',
    'raw(`SELECT ${value}`);',
    'search.query("not SQL text");',
    {
      code: 'analyticsRepo.query("SELECT * FROM users");',
      options: [{ allowedObjectNames: ['analyticsRepo'] }],
    },
    {
      code: 'query("SELECT * FROM users");',
      options: [{ allowedOperations: ['SELECT'] }],
    },
  ],
  invalid: [
    {
      code: 'qr.query("SELECT * FROM users");',
      errors: [{ messageId: 'forbidden', data: { operation: 'SELECT' } }],
    },
    {
      code: 'manager.query(`DELETE FROM users`);',
      errors: [{ messageId: 'forbidden', data: { operation: 'DELETE' } }],
    },
    {
      code: 'db.execute("UPDATE users SET name = \'Alice\'");',
      errors: [{ messageId: 'forbidden', data: { operation: 'UPDATE' } }],
    },
    {
      code: 'raw("INSERT INTO users (name) VALUES (\'Alice\')");',
      errors: [{ messageId: 'forbidden', data: { operation: 'INSERT' } }],
    },
  ],
};

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  },
});

// RuleTester.run throws if any fixture does not behave as asserted, so running
// the same fixtures against each build proves runtime parity.
ruleTester.run('no-raw-query (cjs)', cjsRule, fixtures);
ruleTester.run('no-raw-query (mjs)', mjsRule, fixtures);

console.log('parity: .cjs and .mjs builds are in sync');
