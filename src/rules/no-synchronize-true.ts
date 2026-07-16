import type { Rule } from 'eslint';

// Flags `synchronize: true` in a DataSource / connection options object. Schema
// auto-synchronization drops and recreates columns and is a well-known way to
// lose production data, so it should never be enabled statically.

function getPropertyKeyName(key: any): string | null {
  if (!key) {
    return null;
  }

  if (key.type === 'Identifier') {
    return key.name;
  }

  if (key.type === 'Literal' && typeof key.value === 'string') {
    return key.value;
  }

  return null;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    fixable: 'code',
    docs: {
      description: 'Disallow enabling `synchronize: true` in TypeORM data source configuration.',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/blob/main/docs/rules/no-synchronize-true.md',
    },
    schema: [],
    messages: {
      disallowed:
        '`synchronize: true` auto-alters the database schema and can destroy data. Use migrations instead.',
    },
  },
  create(context: any) {
    return {
      Property(node: any) {
        if (node.computed) {
          return;
        }

        if (getPropertyKeyName(node.key) !== 'synchronize') {
          return;
        }

        if (node.value?.type !== 'Literal' || node.value.value !== true) {
          return;
        }

        context.report({
          node: node.value,
          messageId: 'disallowed',
          fix(fixer: any) {
            return fixer.replaceText(node.value, 'false');
          },
        });
      },
    };
  },
};

export default rule;
