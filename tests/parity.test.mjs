import assert from 'node:assert/strict';
import { RuleTester } from 'eslint';

import noRawQueryCjs from '../lib/rules/no-raw-query.cjs';
import noRawQueryMjs from '../lib/rules/no-raw-query.mjs';
import requireParamCjs from '../lib/rules/require-parameterized-query.cjs';
import requireParamMjs from '../lib/rules/require-parameterized-query.mjs';

import pluginCjs from '../lib/index.cjs';
import pluginMjs from '../lib/index.mjs';

// The package ships two builds of every rule and of the plugin entry
// (CommonJS + ESM). They are maintained by hand and can silently drift. This
// test fails loudly the moment their metadata or runtime behavior diverges.

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  },
});

const rules = [
  {
    name: 'no-raw-query',
    cjs: noRawQueryCjs,
    mjs: noRawQueryMjs,
    fixtures: {
      valid: [
        'req.query.id;',
        'analyticsRepo.query(sqlVariable);',
        'search.query("not SQL text");',
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
      ],
    },
  },
  {
    name: 'require-parameterized-query',
    cjs: requireParamCjs,
    mjs: requireParamMjs,
    fixtures: {
      valid: [
        'query("SELECT * FROM users");',
        'query(sql);',
        'raw(`hello ${name}`);',
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
      ],
    },
  },
];

for (const { name, cjs, mjs, fixtures } of rules) {
  // 1. Metadata must be identical.
  assert.deepStrictEqual(cjs.meta, mjs.meta, `${name}: rule.meta differs between builds`);

  // 2. Both must expose a create function.
  assert.equal(typeof cjs.create, 'function', `${name}: .cjs build is missing create()`);
  assert.equal(typeof mjs.create, 'function', `${name}: .mjs build is missing create()`);

  // 3. Identical fixtures must behave identically in both builds. RuleTester
  //    throws on any mismatch, so running the same fixtures proves parity.
  ruleTester.run(`${name} (cjs)`, cjs, fixtures);
  ruleTester.run(`${name} (mjs)`, mjs, fixtures);
}

// 4. The plugin entry must register the same rules and configs in both builds.
assert.deepStrictEqual(
  Object.keys(pluginCjs.rules).sort(),
  Object.keys(pluginMjs.rules).sort(),
  'plugin registers different rules between builds',
);
assert.deepStrictEqual(
  pluginCjs.configs,
  pluginMjs.configs,
  'plugin configs differ between builds',
);

console.log('parity: .cjs and .mjs builds are in sync');
