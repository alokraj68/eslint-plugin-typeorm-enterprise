// Multi-tenant app: enforce tenant scoping with your own column name.
import typeormEnterprise from 'eslint-plugin-typeorm-enterprise';

export default [
  typeormEnterprise.configs.recommended,
  {
    files: ['src/**/*.ts'],
    plugins: { 'typeorm-enterprise': typeormEnterprise },
    rules: {
      'typeorm-enterprise/require-tenant-scope': ['error', { tenantKeys: ['companyId'] }],
    },
  },
];
