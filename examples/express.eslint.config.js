// Express / plain Node + TypeORM.
const typeormEnterprise = require('eslint-plugin-typeorm-enterprise');

module.exports = [
  typeormEnterprise.configs.recommended,
  {
    // `req.query` is Express request parsing, never SQL — the rules already
    // ignore it, but you can scope the plugin to your data layer explicitly:
    files: ['src/db/**/*.js', 'src/repositories/**/*.js'],
  },
];
