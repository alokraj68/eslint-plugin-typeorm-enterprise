// NestJS + TypeORM: enforce everything and surface performance hints.
// Applied to the service/repository layer where data access lives.
import typeormEnterprise from 'eslint-plugin-typeorm-enterprise';

export default [
  typeormEnterprise.configs.strict,
  typeormEnterprise.configs.performance,
  {
    files: ['src/**/*.ts'],
    rules: {
      // Migrations legitimately run raw DDL — skip them.
      'typeorm-enterprise/no-raw-query': ['error', { ignorePatterns: ['**/migrations/**'] }],
    },
  },
];
