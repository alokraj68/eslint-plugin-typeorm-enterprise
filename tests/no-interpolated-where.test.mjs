import { test } from 'node:test';
import { RuleTester } from 'eslint';

import plugin from '../dist/index.mjs';

const ruleTester = new RuleTester({
  languageOptions: { parserOptions: { ecmaVersion: 2022, sourceType: 'module' } },
});

test('no-interpolated-where', () => {
  ruleTester.run('no-interpolated-where', plugin.rules['no-interpolated-where'], {
    valid: [
      'qb.where("id = :id", { id });',
      'qb.andWhere("name = :name");',
      'qb.where(condition);',
      'qb.orWhere(`static text`);',
      'qb.select("id = " + column);',
    ],
    invalid: [
      { code: 'qb.where(`id = ${id}`);', errors: [{ messageId: 'parameterizeWhere' }] },
      { code: 'qb.andWhere("id = " + id);', errors: [{ messageId: 'parameterizeWhere' }] },
      { code: 'qb.orWhere("name = " + name);', errors: [{ messageId: 'parameterizeWhere' }] },
      { code: 'qb.having(`count > ${n}`);', errors: [{ messageId: 'parameterizeWhere' }] },
    ],
  });
});
