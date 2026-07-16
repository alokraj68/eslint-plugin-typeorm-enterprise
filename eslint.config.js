const typeormEnterprise = require('./lib/index.cjs');

module.exports = [
  {
    ignores: ['node_modules/**', 'graphify-out/**', 'coverage/**', 'dist/**'],
  },
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    plugins: {
      'typeorm-enterprise': typeormEnterprise,
    },
    rules: {
      'typeorm-enterprise/no-raw-query': 'error',
    },
  },
];
