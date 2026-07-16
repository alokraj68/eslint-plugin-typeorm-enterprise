import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'graphify-out/**',
      'node_modules/**',
      'tests/**',
      'examples/**',
      '.githooks/**',
    ],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      // AST nodes are handled structurally; explicit any is intentional here.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
