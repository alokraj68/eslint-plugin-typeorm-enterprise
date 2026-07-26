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
  'require-typed-query-result',
  'no-untyped-record-escape-hatch',
  'require-query-runner-release',
];

test('ESM and CJS builds expose the same rules', () => {
  assert.deepStrictEqual(Object.keys(esmPlugin.rules).sort(), EXPECTED_RULES.slice().sort());
  assert.deepStrictEqual(Object.keys(cjs.rules).sort(), EXPECTED_RULES.slice().sort());
});

test('ships recommended, warn, strict, type-checked, performance, and multiTenant configs', () => {
  for (const name of [
    'recommended',
    'warn',
    'strict',
    'strictTypeChecked',
    'recommendedTypeChecked',
    'performance',
    'multiTenant',
  ]) {
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
  assert.ok(strict.includes('typeorm-enterprise/require-typed-query-result'));
  assert.ok(strict.includes('typeorm-enterprise/no-untyped-record-escape-hatch'));
  assert.ok(!recommended.includes('typeorm-enterprise/require-typed-query-result'));
  assert.ok(!recommended.includes('typeorm-enterprise/no-untyped-record-escape-hatch'));
  assert.ok(performance.includes('typeorm-enterprise/prefer-exists-over-count'));
  assert.ok(multiTenant.includes('typeorm-enterprise/require-tenant-scope'));

  assert.equal(esmPlugin.configs.recommended.rules['typeorm-enterprise/no-raw-query'], 'error');
  assert.equal(esmPlugin.configs.warn.rules['typeorm-enterprise/no-raw-query'], 'warn');
  assert.equal(esmPlugin.configs.performance.rules['typeorm-enterprise/prefer-exists-over-count'], 'warn');
  assert.ok(recommended.includes('typeorm-enterprise/require-query-runner-release'));
});

test('type-checked configs enable typeAware on every rule that supports it', () => {
  for (const configName of ['strictTypeChecked', 'recommendedTypeChecked']) {
    const typeChecked = esmPlugin.configs[configName].rules;
    const plain = esmPlugin.configs[configName === 'strictTypeChecked' ? 'strict' : 'recommended'].rules;

    // Same rule set as the config it mirrors.
    assert.deepStrictEqual(Object.keys(typeChecked).sort(), Object.keys(plain).sort());

    for (const [ruleId, setting] of Object.entries(typeChecked)) {
      const ruleName = ruleId.replace('typeorm-enterprise/', '');
      const schema = esmPlugin.rules[ruleName].meta.schema?.[0];
      const supportsTypeAware = Boolean(schema?.properties?.typeAware);

      if (supportsTypeAware) {
        assert.deepStrictEqual(setting, ['error', { typeAware: true }], `${ruleId} in ${configName}`);
      } else {
        assert.equal(setting, 'error', `${ruleId} in ${configName}`);
      }
    }
  }

  // CJS build agrees.
  assert.deepStrictEqual(cjs.configs.strictTypeChecked.rules, esmPlugin.configs.strictTypeChecked.rules);
});
