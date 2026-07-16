import type { Rule } from 'eslint';

import {
  DEFAULT_METHODS,
  getCalleeInfo,
  getFilename,
  getOptionValue,
  isIgnoredFilename,
  looksLikeSql,
} from '../utils/ast.js';
import { TYPEORM_TYPE_NAMES, receiverPassesTypeGate } from '../utils/types.js';

// query(`SELECT * FROM users WHERE id = ${id}`)
function inspectTemplateLiteral(node: any): boolean {
  if (node.type !== 'TemplateLiteral' || node.expressions.length === 0) {
    return false;
  }

  const skeleton = node.quasis.map((quasi: any) => quasi.value.cooked || '').join('');
  return looksLikeSql(skeleton);
}

function flattenConcatenation(node: any): any[] {
  if (node.type === 'BinaryExpression' && node.operator === '+') {
    return [...flattenConcatenation(node.left), ...flattenConcatenation(node.right)];
  }

  return [node];
}

// query('SELECT * FROM users WHERE id = ' + userId)
function inspectConcatenation(node: any): boolean {
  if (node.type !== 'BinaryExpression' || node.operator !== '+') {
    return false;
  }

  const operands = flattenConcatenation(node);
  const isStringLiteral = (operand: any) =>
    operand.type === 'Literal' && typeof operand.value === 'string';

  const hasDynamic = operands.some((operand) => !isStringLiteral(operand));
  if (!hasDynamic) {
    return false;
  }

  const staticText = operands.map((operand) => (isStringLiteral(operand) ? operand.value : '')).join('');
  return looksLikeSql(staticText);
}

function isDynamicSqlArgument(node: any): boolean {
  if (!node) {
    return false;
  }

  return inspectTemplateLiteral(node) || inspectConcatenation(node);
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require parameterized queries instead of interpolated or concatenated raw SQL.',
      category: 'Possible Errors',
      recommended: true,
      url: 'https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/blob/main/docs/rules/require-parameterized-query.md',
    },
    schema: [
      {
        type: 'object',
        properties: {
          restrictedMethods: { type: 'array', items: { type: 'string' } },
          allowedObjectNames: { type: 'array', items: { type: 'string' } },
          typeAware: { type: 'boolean' },
          ignorePatterns: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      parameterize:
        'SQL is built with string interpolation or concatenation, which risks SQL injection. Use parameterized queries (bound parameters) or the TypeORM QueryBuilder instead.',
    },
  },
  create(context: any) {
    const options = context.options?.[0] ? context.options[0] : {};
    const restrictedMethods = new Set(
      getOptionValue(options, 'restrictedMethods', DEFAULT_METHODS).map((method) => method.toLowerCase()),
    );
    const allowedObjectNames = getOptionValue(options, 'allowedObjectNames', []);
    const typeAware = options.typeAware === true;
    const ignorePatterns = getOptionValue(options, 'ignorePatterns', []);

    return {
      CallExpression(node: any) {
        if (isIgnoredFilename(getFilename(context), ignorePatterns)) {
          return;
        }

        const calleeInfo = getCalleeInfo(node.callee);
        if (!calleeInfo.methodName) {
          return;
        }

        const methodName = calleeInfo.methodName.toLowerCase();
        if (!restrictedMethods.has(methodName)) {
          return;
        }

        if (calleeInfo.objectName && allowedObjectNames.includes(calleeInfo.objectName)) {
          return;
        }

        const receiver = node.callee.type === 'MemberExpression' ? node.callee.object : null;
        if (!receiverPassesTypeGate(context, receiver, typeAware, TYPEORM_TYPE_NAMES)) {
          return;
        }

        const firstArg = node.arguments[0];
        if (!isDynamicSqlArgument(firstArg)) {
          return;
        }

        context.report({ node: firstArg, messageId: 'parameterize' });
      },
    };
  },
};

export default rule;
