import type { Rule } from 'eslint';

import { getFilename, getOptionValue, isIgnoredFilename } from '../utils/ast.js';

// Flags data-mutating manager/repository calls (save, remove, insert, update,
// delete, ...) that are not lexically wrapped in a `.transaction(...)` callback.
// This is opinionated and heuristic (it cannot see types), so it ships only in
// the `strict` config, not `recommended`.

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

function getMethodName(callee: any): string | null {
  if (callee.type === 'MemberExpression' && !callee.computed && callee.property.type === 'Identifier') {
    return callee.property.name;
  }

  return null;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require data-mutating operations to run inside a transaction callback.',
      category: 'Best Practices',
      recommended: false,
      url: 'https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/blob/main/docs/rules/require-transaction.md',
    },
    schema: [
      {
        type: 'object',
        properties: {
          mutationMethods: { type: 'array', items: { type: 'string' } },
          transactionMethods: { type: 'array', items: { type: 'string' } },
          ignorePatterns: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      requireTransaction:
        'Mutating operation "{{method}}" should run inside a transaction (e.g. dataSource.transaction(...)).',
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
    const ignorePatterns = getOptionValue(options, 'ignorePatterns', []);
    const sourceCode = context.sourceCode ?? context.getSourceCode?.();

    function getAncestors(node: any): any[] {
      if (sourceCode?.getAncestors) {
        return sourceCode.getAncestors(node);
      }
      return context.getAncestors();
    }

    return {
      CallExpression(node: any) {
        if (isIgnoredFilename(getFilename(context), ignorePatterns)) {
          return;
        }

        const method = getMethodName(node.callee);
        if (!method || !mutationMethods.has(method.toLowerCase())) {
          return;
        }

        const insideTransaction = getAncestors(node).some((ancestor: any) => {
          if (ancestor.type !== 'CallExpression') {
            return false;
          }
          const ancestorMethod = getMethodName(ancestor.callee);
          const ancestorCalleeName =
            ancestor.callee.type === 'Identifier' ? ancestor.callee.name : null;
          return (
            (ancestorMethod && transactionMethods.has(ancestorMethod.toLowerCase())) ||
            (ancestorCalleeName && transactionMethods.has(ancestorCalleeName.toLowerCase()))
          );
        });

        if (insideTransaction) {
          return;
        }

        context.report({ node, messageId: 'requireTransaction', data: { method } });
      },
    };
  },
};

export default rule;
