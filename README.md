# eslint-plugin-typeorm-enterprise

A production-ready ESLint plugin designed to prevent raw SQL execution in TypeORM applications and support enterprise backend governance.

## Installation

```bash
npm install --save-dev eslint eslint-plugin-typeorm-enterprise
```

## Usage

### Legacy `.eslintrc` configuration

```js
module.exports = {
  plugins: ['typeorm-enterprise'],
  rules: {
    'typeorm-enterprise/no-raw-query': 'error',
  },
};
```

### Flat config (`eslint.config.js`)

```js
module.exports = {
  plugins: {
    'typeorm-enterprise': require('eslint-plugin-typeorm-enterprise'),
  },
  rules: {
    'typeorm-enterprise/no-raw-query': 'error',
  },
};
```

## Rule: `typeorm-enterprise/no-raw-query`

This rule prevents raw SQL execution through TypeORM-style methods and standalone query helpers. It focuses on first-argument SQL strings and template literals while avoiding false positives in common request and router patterns.

### Default behavior

The rule flags raw SQL statements passed to `query`, `execute`, and `raw` functions or methods.

### Supported SQL operations

- `SELECT`
- `INSERT`
- `UPDATE`
- `DELETE`
- `WITH`
- `ALTER`
- `DROP`
- `CREATE`
- `TRUNCATE`

### Options

The rule accepts an options object:

```js
{
  restrictedOperations: [],
  allowedOperations: [],
  restrictedMethods: [],
  allowedObjectNames: [],
  ignorePatterns: [],
}
```

- `restrictedOperations`: SQL operations to block. Defaults to all supported operations.
- `allowedOperations`: Overrides blocked operations when an operation is permitted.
- `restrictedMethods`: Methods to inspect. Defaults to `["query", "execute", "raw"]`.
- `allowedObjectNames`: Object names that are permitted to execute raw SQL.
- `ignorePatterns`: File globs to skip entirely.

### Examples

```js
// invalid
repo.query('SELECT * FROM users');
manager.query(`DELETE FROM users`);
db.execute('UPDATE users SET name = ?');
raw('INSERT INTO users (name) VALUES (?)');

// valid
req.query.id;
router.query.page;
search.query();
analyticsRepo.query(sqlVariable);
query(dynamicSql);
```

### Example with options

```js
module.exports = {
  plugins: ['typeorm-enterprise'],
  rules: {
    'typeorm-enterprise/no-raw-query': [
      'error',
      {
        allowedOperations: ['SELECT'],
        allowedObjectNames: ['analyticsRepo'],
        ignorePatterns: ['**/migrations/**'],
      },
    ],
  },
};
```

## Migration-safe rationale

This plugin is designed for enterprise-safe backend rules in TypeORM projects. It allows teams to prevent direct raw SQL usage and steer code toward query builders, repository methods, or strong database abstractions.

The rule is intentionally conservative about dynamic values, only enforcing static SQL string and template literal patterns so it avoids incorrect flags in non-SQL control flow.

## Enterprise governance

By centralizing SQL execution policies, this plugin helps enforce consistent patterns across large teams and monorepos. It's built to be extensible so additional enterprise governance rules can be added later without changing the core architecture.

## License

MIT
