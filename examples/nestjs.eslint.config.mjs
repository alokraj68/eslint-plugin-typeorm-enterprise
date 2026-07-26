// NestJS + TypeORM: enforce everything and surface performance hints.
// Applied to the service/repository layer where data access lives.
import tseslint from 'typescript-eslint';
import typeormEnterprise from 'eslint-plugin-typeorm-enterprise';

export default [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  // Type-checked variant of `strict`: receivers are confirmed by their TypeORM
  // type rather than their name. Drop the `TypeChecked` suffix (and the parser
  // block above) to run without type information.
  typeormEnterprise.configs.strictTypeChecked,
  typeormEnterprise.configs.performance,
  {
    files: ['src/**/*.ts'],
    rules: {
      // Migrations legitimately run raw DDL — skip them.
      'typeorm-enterprise/no-raw-query': ['error', { ignorePatterns: ['**/migrations/**'] }],
      // Reporting queries are dynamic pivots with no static row shape;
      // Record<string, unknown> is the honest type for them. `any` stays blocked.
      'typeorm-enterprise/no-untyped-record-escape-hatch': ['error', { allowUnknown: true }],
    },
  },
];
