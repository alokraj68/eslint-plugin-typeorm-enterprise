import type { Rule } from 'eslint';

import { getFilename, getOptionValue, isIgnoredFilename, normalizeArray } from '../utils/ast.js';
import {
  DEFAULT_RECEIVER_NAMES,
  DEFAULT_RESULT_METHODS,
  getCalledMethodName,
  getResultTypeInfo,
  isLooseTypeNode,
  isTypeOrmReceiver,
} from '../utils/query-result.js';

// Blocks the usual ways of "typing" a raw TypeORM query result without actually
// declaring a shape: `any`, `object`, `{}`, `Record<string, any>`,
// `Map<string, any>` — including through `Promise<...>`, arrays and unions.
// These pass `require-typed-query-result` while giving up every guarantee it
// was meant to buy, so on strict configs both rules are enabled together.
//
// `Record<string, unknown>` is genuinely correct for dynamic pivot and
// aggregate queries; `{ allowUnknown: true }` permits it (and bare `unknown`)
// while still blocking `any`.

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow typing raw TypeORM query results with escape hatches such as any, object or Record<string, any>.',
      category: 'Best Practices',
      recommended: false,
      url: 'https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/blob/main/docs/rules/no-untyped-record-escape-hatch.md',
    },
    schema: [
      {
        type: 'object',
        properties: {
          methods: { type: 'array', items: { type: 'string' } },
          receiverNames: { type: 'array', items: { type: 'string' } },
          allowUnknown: { type: 'boolean' },
          extraLooseTypes: { type: 'array', items: { type: 'string' } },
          typeAware: { type: 'boolean' },
          ignorePatterns: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      looseResultType:
        'Result of "{{method}}" is typed with an escape hatch. Declare a real row interface instead of a broad type such as any, object or Record<string, any>.',
    },
  },
  create(context: any) {
    const options = context.options?.[0] ? context.options[0] : {};
    const methods = new Set(getOptionValue(options, 'methods', DEFAULT_RESULT_METHODS));
    const receiverNames = new Set(
      getOptionValue(options, 'receiverNames', DEFAULT_RECEIVER_NAMES),
    );
    const typeAware = options.typeAware !== false;
    const ignorePatterns = normalizeArray(options.ignorePatterns);
    const looseOptions = {
      allowUnknown: options.allowUnknown === true,
      extraLooseTypes: new Set(normalizeArray(options.extraLooseTypes)),
    };

    return {
      CallExpression(node: any) {
        if (isIgnoredFilename(getFilename(context), ignorePatterns)) {
          return;
        }

        const method = getCalledMethodName(node);
        if (!method || !methods.has(method)) {
          return;
        }

        if (!isTypeOrmReceiver(context, node, typeAware, receiverNames)) {
          return;
        }

        const info = getResultTypeInfo(node);
        if (!info.typeNode || !isLooseTypeNode(info.typeNode, looseOptions)) {
          return;
        }

        context.report({
          node: info.reportNode,
          messageId: 'looseResultType',
          data: { method },
        });
      },
    };
  },
};

export default rule;
