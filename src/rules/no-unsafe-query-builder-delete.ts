import type { Rule } from 'eslint';

import { getFilename, getOptionValue, isIgnoredFilename } from '../utils/ast.js';
import { QUERY_BUILDER_TYPE_NAMES, receiverPassesTypeGate } from '../utils/types.js';

// Flags a QueryBuilder delete/update chain that reaches `.execute()` without a
// `.where()` (or `.andWhere()` / `.orWhere()`). Such a chain mutates every row
// in the table — a classic production accident.

const MUTATION_METHODS = new Set(['delete', 'update']);
const WHERE_METHODS = new Set(['where', 'andwhere', 'orwhere']);

function collectChainMethods(node: any): string[] {
  const methods: string[] = [];
  let current = node.callee?.object;

  while (current?.type === 'CallExpression') {
    const callee = current.callee;
    if (callee.type === 'MemberExpression' && !callee.computed && callee.property.type === 'Identifier') {
      methods.push(callee.property.name.toLowerCase());
    }
    current = callee.type === 'MemberExpression' ? callee.object : undefined;
  }

  return methods;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow QueryBuilder delete/update chains that execute without a where clause.',
      category: 'Possible Errors',
      recommended: true,
      url: 'https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/blob/main/docs/rules/no-unsafe-query-builder-delete.md',
    },
    schema: [
      {
        type: 'object',
        properties: {
          typeAware: { type: 'boolean' },
          ignorePatterns: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingWhere:
        'QueryBuilder "{{operation}}" reaches .execute() without a .where() clause and will affect every row. Add a .where(...) constraint.',
    },
  },
  create(context: any) {
    const options = context.options?.[0] ? context.options[0] : {};
    const typeAware = options.typeAware === true;
    const ignorePatterns = getOptionValue(options, 'ignorePatterns', []);

    return {
      CallExpression(node: any) {
        if (isIgnoredFilename(getFilename(context), ignorePatterns)) {
          return;
        }

        const callee = node.callee;
        if (callee.type !== 'MemberExpression' || callee.computed) {
          return;
        }

        if (callee.property.type !== 'Identifier' || callee.property.name.toLowerCase() !== 'execute') {
          return;
        }

        const chain = collectChainMethods(node);
        const operation = chain.find((method) => MUTATION_METHODS.has(method));
        if (!operation) {
          return;
        }

        const hasWhere = chain.some((method) => WHERE_METHODS.has(method));
        if (hasWhere) {
          return;
        }

        if (!receiverPassesTypeGate(context, callee.object, typeAware, QUERY_BUILDER_TYPE_NAMES)) {
          return;
        }

        context.report({
          node,
          messageId: 'missingWhere',
          data: { operation: operation.toUpperCase() },
        });
      },
    };
  },
};

export default rule;
