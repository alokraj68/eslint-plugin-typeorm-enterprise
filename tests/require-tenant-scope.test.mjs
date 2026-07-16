import { test } from 'node:test';
import { RuleTester } from 'eslint';

import plugin from '../dist/index.mjs';

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
});

test('require-tenant-scope', () => {
  ruleTester.run('require-tenant-scope', plugin.rules['require-tenant-scope'], {
    valid: [
      'repo.find({ where: { tenantId: t } });',
      'repo.findOne({ where: { organizationId: o } });',
      'repo.save(entity);',
      // Custom tenant key supplied via options.
      {
        code: 'repo.find({ where: { companyId: c } });',
        options: [{ tenantKeys: ['companyId'] }],
      },
    ],
    invalid: [
      {
        code: 'repo.find({ where: { name: n } });',
        errors: [{ messageId: 'missingTenant' }],
      },
      {
        code: 'repo.delete({ id });',
        errors: [{ messageId: 'missingTenant' }],
      },
      // Default keys do not match the custom schema.
      {
        code: 'repo.find({ where: { tenantId: t } });',
        options: [{ tenantKeys: ['companyId'] }],
        errors: [{ messageId: 'missingTenant' }],
      },
    ],
  });
});
