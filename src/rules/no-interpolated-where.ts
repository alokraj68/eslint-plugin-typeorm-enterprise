import type { Rule } from 'eslint';

import {
  getCalleeInfo,
  getFilename,
  getOptionValue,
  isDynamicStringExpression,
  isIgnoredFilename,
} from '../utils/ast.js';
import { QUERY_BUILDER_TYPE_NAMES, receiverPassesTypeGate } from '../utils/types.js';

// Flags QueryBuilder where-style clauses whose condition string is built with
// interpolation or concatenation, e.g. .where(`id = ${id}`) or
// .where('id = ' + id). Use bound parameters: .where('id = :id', { id }).

const DEFAULT_METHODS = ['where', 'andWhere', 'orWhere', 'having'];

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow interpolated or concatenated strings in QueryBuilder where clauses.',
      category: 'Possible Errors',
      recommended: true,
      url: 'https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/blob/main/docs/rules/no-interpolated-where.md',
    },
    schema: [
      {
        type: 'object',
        properties: {
          methods: { type: 'array', items: { type: 'string' } },
          typeAware: { type: 'boolean' },
          ignorePatterns: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      parameterizeWhere:
        'The where condition is built with string interpolation or concatenation, which risks SQL injection. Use bound parameters, e.g. .where("id = :id", { id }).',
    },
  },
  create(context: any) {
    const options = context.options?.[0] ? context.options[0] : {};
    const methods = new Set(getOptionValue(options, 'methods', DEFAULT_METHODS).map((m) => m.toLowerCase()));
    const typeAware = options.typeAware === true;
    const ignorePatterns = getOptionValue(options, 'ignorePatterns', []);

    return {
      CallExpression(node: any) {
        if (isIgnoredFilename(getFilename(context), ignorePatterns)) {
          return;
        }

        const { methodName } = getCalleeInfo(node.callee);
        if (!methodName || !methods.has(methodName.toLowerCase())) {
          return;
        }

        const receiver = node.callee.type === 'MemberExpression' ? node.callee.object : null;
        if (!receiverPassesTypeGate(context, receiver, typeAware, QUERY_BUILDER_TYPE_NAMES)) {
          return;
        }

        const firstArg = node.arguments[0];
        if (!isDynamicStringExpression(firstArg)) {
          return;
        }

        context.report({ node: firstArg, messageId: 'parameterizeWhere' });
      },
    };
  },
};

export default rule;
