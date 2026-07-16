import type { Rule } from 'eslint';

import {
  DEFAULT_METHODS,
  DEFAULT_OPERATIONS,
  SQL_KEYWORD_REGEX,
  getCalleeInfo,
  getFilename,
  getOptionValue,
  isIgnoredFilename,
} from '../utils/ast.js';

function isStaticSqlArgument(node: any): boolean {
  if (!node) {
    return false;
  }

  if (node.type === 'Literal' && typeof node.value === 'string') {
    return true;
  }

  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis.every((quasi: any) => typeof quasi.value.cooked === 'string');
  }

  return false;
}

function extractSqlArgumentText(node: any): string {
  if (node.type === 'Literal') {
    return String(node.value);
  }

  if (node.type === 'TemplateLiteral') {
    return node.quasis.map((quasi: any) => quasi.value.cooked || '').join('');
  }

  return '';
}

function getFirstSqlOperation(text: string): string | null {
  if (typeof text !== 'string') {
    return null;
  }

  const match = new RegExp(SQL_KEYWORD_REGEX).exec(text.trim());
  return match ? match[1].toUpperCase() : null;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow raw SQL execution through TypeORM query helpers and raw SQL methods.',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/blob/main/docs/rules/no-raw-query.md',
    },
    schema: [
      {
        type: 'object',
        properties: {
          restrictedOperations: { type: 'array', items: { type: 'string' } },
          allowedOperations: { type: 'array', items: { type: 'string' } },
          restrictedMethods: { type: 'array', items: { type: 'string' } },
          allowedObjectNames: { type: 'array', items: { type: 'string' } },
          ignorePatterns: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      forbidden:
        'Raw SQL operation "{{operation}}" is not allowed. Use TypeORM QueryBuilder or Repository APIs instead.',
    },
  },
  create(context: any) {
    const options = context.options?.[0] ? context.options[0] : {};
    const restrictedOperations = getOptionValue(options, 'restrictedOperations', DEFAULT_OPERATIONS);
    const allowedOperations = getOptionValue(options, 'allowedOperations', []);
    const restrictedMethods = new Set(
      getOptionValue(options, 'restrictedMethods', DEFAULT_METHODS).map((method) => method.toLowerCase()),
    );
    const allowedObjectNames = getOptionValue(options, 'allowedObjectNames', []);
    const ignorePatterns = getOptionValue(options, 'ignorePatterns', []);

    const activeOperations = restrictedOperations.filter(
      (operation) => !allowedOperations.includes(operation),
    );
    const blockedOperations = new Set(activeOperations.map((operation) => operation.toUpperCase()));

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

        const firstArg = node.arguments[0];
        if (!isStaticSqlArgument(firstArg)) {
          return;
        }

        const sqlText = extractSqlArgumentText(firstArg);
        const operation = getFirstSqlOperation(sqlText);
        if (!operation || !blockedOperations.has(operation)) {
          return;
        }

        context.report({
          node: firstArg,
          messageId: 'forbidden',
          data: { operation },
        });
      },
    };
  },
};

export default rule;
