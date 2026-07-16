const { RuleTester } = require('eslint');
const rule = require('../lib/rules/require-parameterized-query.cjs');

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  },
});

ruleTester.run('require-parameterized-query', rule, {
  valid: [
    // Static SQL — handled by no-raw-query, not this rule.
    'query("SELECT * FROM users");',
    'manager.query(`DELETE FROM users`);',
    // Concatenation of only string literals is still static.
    'query("SELECT * FROM " + "users");',
    // Dynamic value that is not SQL text.
    'query(sql);',
    'raw(`hello ${name}`);',
    'search.query(`greeting ${name}`);',
    // Property access / non-call.
    'req.query.id;',
    // Method not inspected.
    'logger.info("SELECT * FROM users WHERE id = " + id);',
    // Allow-listed object.
    {
      code: 'analyticsRepo.query(`SELECT * FROM t WHERE id = ${id}`);',
      options: [{ allowedObjectNames: ['analyticsRepo'] }],
    },
    // Ignored file.
    {
      code: 'manager.query("SELECT * FROM users WHERE id = " + id);',
      filename: 'migrations/20250101.js',
      options: [{ ignorePatterns: ['**/migrations/**'] }],
    },
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
    {
      code: 'db.execute(`UPDATE users SET name = ${name} WHERE id = ${id}`);',
      errors: [{ messageId: 'parameterize' }],
    },
    {
      code: 'raw("DELETE FROM users WHERE id = " + id);',
      errors: [{ messageId: 'parameterize' }],
    },
    {
      code: 'repo.query("SELECT * FROM t WHERE a = " + a + " AND b = " + b);',
      errors: [{ messageId: 'parameterize' }],
    },
  ],
});
