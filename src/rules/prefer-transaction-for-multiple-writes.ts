import type { Rule } from 'eslint';

import { getFilename, getOptionValue, isIgnoredFilename } from '../utils/ast.js';

// Flags a function that performs two or more data-mutating operations
// (save/remove/insert/update/delete/...) outside a transaction, and asks the
// author to combine them into a single dataSource.transaction(...) for
// atomicity. Heuristic (no type info) — ships in the `strict` config only.

const DEFAULT_MUTATIONS = [
  'save',
  'remove',
  'softremove',
  'recover',
  'insert',
  'update',
  'delete',
  'upsert',
];

const DEFAULT_TRANSACTION_METHODS = ['transaction'];
const FUNCTION_TYPES = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);

function getMethodName(callee: any): string | null {
  if (callee.type === 'MemberExpression' && !callee.computed && callee.property.type === 'Identifier') {
    return callee.property.name;
  }
  if (callee.type === 'Identifier') {
    return callee.name;
  }
  return null;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Suggest combining multiple write operations into a single transaction.',
      category: 'Best Practices',
      recommended: false,
      url: 'https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/blob/main/docs/rules/prefer-transaction-for-multiple-writes.md',
    },
    schema: [
      {
        type: 'object',
        properties: {
          mutationMethods: { type: 'array', items: { type: 'string' } },
          transactionMethods: { type: 'array', items: { type: 'string' } },
          threshold: { type: 'integer', minimum: 2 },
          ignorePatterns: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      combine:
        '{{count}} write operations run outside a transaction in this function. Combine them into a single dataSource.transaction(...) so they commit or roll back together.',
    },
  },
  create(context: any) {
    const options = context.options?.[0] ? context.options[0] : {};
    const mutationMethods = new Set(
      getOptionValue(options, 'mutationMethods', DEFAULT_MUTATIONS).map((m) => m.toLowerCase()),
    );
    const transactionMethods = new Set(
      getOptionValue(options, 'transactionMethods', DEFAULT_TRANSACTION_METHODS).map((m) => m.toLowerCase()),
    );
    const threshold = typeof options.threshold === 'number' ? options.threshold : 2;
    const ignorePatterns = getOptionValue(options, 'ignorePatterns', []);
    const sourceCode = context.sourceCode ?? context.getSourceCode?.();

    function getAncestors(node: any): any[] {
      return sourceCode?.getAncestors ? sourceCode.getAncestors(node) : context.getAncestors();
    }

    // Map from enclosing function node (or Program) to the mutation call nodes.
    const scopes = new Map<any, any[]>();

    return {
      CallExpression(node: any) {
        if (isIgnoredFilename(getFilename(context), ignorePatterns)) {
          return;
        }

        const method = getMethodName(node.callee);
        if (!method || !mutationMethods.has(method.toLowerCase())) {
          return;
        }

        const ancestors = getAncestors(node);

        const insideTransaction = ancestors.some((ancestor: any) => {
          if (ancestor.type !== 'CallExpression') {
            return false;
          }
          const ancestorMethod = getMethodName(ancestor.callee);
          return ancestorMethod && transactionMethods.has(ancestorMethod.toLowerCase());
        });
        if (insideTransaction) {
          return;
        }

        let scopeKey: any = 'program';
        for (let i = ancestors.length - 1; i >= 0; i -= 1) {
          if (FUNCTION_TYPES.has(ancestors[i].type)) {
            scopeKey = ancestors[i];
            break;
          }
        }

        const existing = scopes.get(scopeKey) ?? [];
        existing.push(node);
        scopes.set(scopeKey, existing);
      },

      'Program:exit'() {
        for (const nodes of scopes.values()) {
          if (nodes.length >= threshold) {
            context.report({
              node: nodes[0],
              messageId: 'combine',
              data: { count: String(nodes.length) },
            });
          }
        }
      },
    };
  },
};

export default rule;
