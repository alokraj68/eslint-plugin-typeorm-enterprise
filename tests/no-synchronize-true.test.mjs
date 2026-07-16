import { test } from 'node:test';
import { RuleTester } from 'eslint';

import plugin from '../dist/index.mjs';

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
});

test('no-synchronize-true', () => {
  ruleTester.run('no-synchronize-true', plugin.rules['no-synchronize-true'], {
    valid: [
      'const options = { synchronize: false };',
      'const options = { synchronize: isDev };',
      'const options = { name: true };',
      'const options = { "synchronize": false };',
      'const options = { [synchronize]: true };',
    ],
    invalid: [
      {
        code: 'const options = { synchronize: true };',
        output: 'const options = { synchronize: false };',
        errors: [{ messageId: 'disallowed' }],
      },
      {
        code: 'new DataSource({ type: "postgres", synchronize: true });',
        output: 'new DataSource({ type: "postgres", synchronize: false });',
        errors: [{ messageId: 'disallowed' }],
      },
      {
        code: 'const options = { "synchronize": true };',
        output: 'const options = { "synchronize": false };',
        errors: [{ messageId: 'disallowed' }],
      },
    ],
  });
});
