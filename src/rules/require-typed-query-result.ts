import type { Rule } from 'eslint';

import { getFilename, isIgnoredFilename, normalizeArray, getOptionValue } from '../utils/ast.js';
import {
  DEFAULT_RECEIVER_NAMES,
  DEFAULT_RESULT_METHODS,
  getCalledMethodName,
  getResultTypeInfo,
  isTypeOrmReceiver,
} from '../utils/query-result.js';
import { resultTypeIsAny } from '../utils/types.js';

// Requires the result of a raw TypeORM query to be given a type. `query()`,
// `getRawMany()` and friends return `any`, so an untyped call site silently
// spreads `any` through the codebase and defeats every downstream type check.
//
// With `{ typeAware: true }` (the default) and type information available, the
// call's inferred result type decides: only results that really are `any` are
// flagged, so a wrapper that already returns a typed row is left alone. Without
// type information the rule falls back to a syntactic check — a type argument,
// a variable annotation, an `as` assertion, or the enclosing function's return
// type must be present.
//
// Companion rule: `no-untyped-record-escape-hatch` covers results that *are*
// typed, but with an escape hatch such as `Record<string, any>`.

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require raw TypeORM query results to be explicitly typed.',
      category: 'Best Practices',
      recommended: false,
      url: 'https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/blob/main/docs/rules/require-typed-query-result.md',
    },
    schema: [
      {
        type: 'object',
        properties: {
          methods: { type: 'array', items: { type: 'string' } },
          receiverNames: { type: 'array', items: { type: 'string' } },
          typeAware: { type: 'boolean' },
          ignorePatterns: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingResultType:
        'Result of "{{method}}" is untyped ("any"). Declare the row shape, e.g. {{method}}<UserRow[]>(...) or "const rows: UserRow[] = ...".',
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

        // Nothing consumes the rows, or the caller already declared a shape.
        // A declared shape that is itself an escape hatch is the companion
        // rule's job, not this one's.
        if (info.kind !== 'none') {
          return;
        }

        if (typeAware) {
          // Only report when the inferred result really is `any`; a wrapper or
          // a custom repository that returns a typed row is fine untouched.
          const isAny = resultTypeIsAny(context, node);
          if (isAny === false) {
            return;
          }
        }

        context.report({ node, messageId: 'missingResultType', data: { method } });
      },
    };
  },
};

export default rule;
