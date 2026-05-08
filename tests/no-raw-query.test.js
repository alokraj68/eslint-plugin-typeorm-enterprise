const { RuleTester } = require('eslint');
const rule = require('../lib/rules/no-raw-query.cjs');

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  },
});

ruleTester.run('no-raw-query', rule, {
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
      options: [
        {
          allowedObjectNames: ['analyticsRepo'],
        },
      ],
    },
    {
      code: 'query("SELECT * FROM users");',
      options: [
        {
          allowedOperations: ['SELECT'],
        },
      ],
    },
    {
      code: 'manager.query("DROP TABLE users");',
      filename: 'migrations/20250101.js',
      options: [
        {
          ignorePatterns: ['**/migrations/**'],
        },
      ],
    },
  ],
  invalid: [
    {
      code: 'qr.query("SELECT * FROM users");',
      errors: [
        {
          messageId: 'forbidden',
          data: { operation: 'SELECT' },
        },
      ],
    },
    {
      code: 'manager.query(`DELETE FROM users`);',
      errors: [
        {
          messageId: 'forbidden',
          data: { operation: 'DELETE' },
        },
      ],
    },
    {
      code: 'db.execute("UPDATE users SET name = \'Alice\'");',
      errors: [
        {
          messageId: 'forbidden',
          data: { operation: 'UPDATE' },
        },
      ],
    },
    {
      code: 'raw("INSERT INTO users (name) VALUES (\'Alice\')");',
      errors: [
        {
          messageId: 'forbidden',
          data: { operation: 'INSERT' },
        },
      ],
    },
    {
      code: 'repo.query("DROP TABLE users");',
      options: [
        {
          restrictedOperations: ['DROP'],
        },
      ],
      errors: [
        {
          messageId: 'forbidden',
          data: { operation: 'DROP' },
        },
      ],
    },
  ],
});
