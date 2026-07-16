import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

import esmPlugin from '../dist/index.mjs';

const require = createRequire(import.meta.url);
const cjsPlugin = require('../dist/index.cjs');
const cjs = cjsPlugin.default ?? cjsPlugin;

const EXPECTED_RULES = [
  'no-raw-query',
  'require-parameterized-query',
  'no-synchronize-true',
  'no-entity-manager-query',
  'require-transaction',
  'no-unsafe-query-builder-delete',
  'no-interpolated-where',
  'prefer-transaction-for-multiple-writes',
  'require-tenant-scope',
  'prefer-exists-over-count',
];

test('ESM and CJS builds expose the same rules', () => {
  assert.deepStrictEqual(Object.keys(esmPlugin.rules).sort(), EXPECTED_RULES.slice().sort());
  assert.deepStrictEqual(Object.keys(cjs.rules).sort(), EXPECTED_RULES.slice().sort());
});

test('ships recommended, warn, strict, performance, and multiTenant configs', () => {
  for (const name of ['recommended', 'warn', 'strict', 'performance', 'multiTenant']) {
    assert.ok(esmPlugin.configs[name], `ESM missing config ${name}`);
    assert.ok(cjs.configs[name], `CJS missing config ${name}`);
  }
});

test('config membership is correct', () => {
  const recommended = Object.keys(esmPlugin.configs.recommended.rules);
  const strict = Object.keys(esmPlugin.configs.strict.rules);
  const performance = Object.keys(esmPlugin.configs.performance.rules);
  const multiTenant = Object.keys(esmPlugin.configs.multiTenant.rules);

  assert.ok(!recommended.includes('typeorm-enterprise/require-transaction'));
  assert.ok(strict.includes('typeorm-enterprise/require-transaction'));
  assert.ok(strict.includes('typeorm-enterprise/prefer-transaction-for-multiple-writes'));
  assert.ok(performance.includes('typeorm-enterprise/prefer-exists-over-count'));
  assert.ok(multiTenant.includes('typeorm-enterprise/require-tenant-scope'));

  assert.equal(esmPlugin.configs.recommended.rules['typeorm-enterprise/no-raw-query'], 'error');
  assert.equal(esmPlugin.configs.warn.rules['typeorm-enterprise/no-raw-query'], 'warn');
  assert.equal(esmPlugin.configs.performance.rules['typeorm-enterprise/prefer-exists-over-count'], 'warn');
});
