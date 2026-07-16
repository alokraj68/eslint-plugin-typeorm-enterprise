import type { Rule } from 'eslint';

import { getFilename, getOptionValue, isIgnoredFilename } from '../utils/ast.js';

// Performance rule. Flags count()/getCount() whose result is only used to test
// existence (compared with 0/1, or used as a boolean). Counting scans matching
// rows; an existence check can stop at the first row, so prefer .exists() or a
// LIMIT 1 lookup.

const DEFAULT_METHODS = ['count', 'getCount', 'getManyAndCount'];
const COMPARISON_OPERATORS = new Set(['>', '<', '>=', '<=', '===', '!==', '==', '!=']);

function unwrapAwait(node: any): any {
  return node?.type === 'AwaitExpression' ? node.parent : node;
}

function isExistenceContext(callNode: any): boolean {
  const parent = unwrapAwait(callNode.parent);
  if (!parent) {
    return false;
  }

  // count() > 0, count() === 0, etc. against a numeric literal.
  if (parent.type === 'BinaryExpression' && COMPARISON_OPERATORS.has(parent.operator)) {
    const other = parent.left === callNode || parent.left === callNode.parent ? parent.right : parent.left;
    return other?.type === 'Literal' && typeof other.value === 'number';
  }

  // !count()
  if (parent.type === 'UnaryExpression' && parent.operator === '!') {
    return true;
  }

  // if (count()) / while (count()) / count() ? a : b
  if (
    (parent.type === 'IfStatement' ||
      parent.type === 'WhileStatement' ||
      parent.type === 'DoWhileStatement' ||
      parent.type === 'ConditionalExpression') &&
    parent.test === (callNode.parent?.type === 'AwaitExpression' ? callNode.parent : callNode)
  ) {
    return true;
  }

  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer an existence check over counting rows when only presence matters.',
      category: 'Performance',
      recommended: false,
      url: 'https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/blob/main/docs/rules/prefer-exists-over-count.md',
    },
    schema: [
      {
        type: 'object',
        properties: {
          methods: { type: 'array', items: { type: 'string' } },
          ignorePatterns: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      preferExists:
        'Using "{{method}}" only to test existence scans matching rows. Use .exists() (or a LIMIT 1 lookup) instead.',
    },
  },
  create(context: any) {
    const options = context.options?.[0] ? context.options[0] : {};
    const methods = new Set(getOptionValue(options, 'methods', DEFAULT_METHODS).map((m) => m.toLowerCase()));
    const ignorePatterns = getOptionValue(options, 'ignorePatterns', []);

    return {
      CallExpression(node: any) {
        if (isIgnoredFilename(getFilename(context), ignorePatterns)) {
          return;
        }

        const callee = node.callee;
        if (callee.type !== 'MemberExpression' || callee.computed || callee.property.type !== 'Identifier') {
          return;
        }

        const method = callee.property.name;
        if (!methods.has(method.toLowerCase())) {
          return;
        }

        if (!isExistenceContext(node)) {
          return;
        }

        context.report({ node, messageId: 'preferExists', data: { method } });
      },
    };
  },
};

export default rule;
