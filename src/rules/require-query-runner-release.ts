import type { Rule } from 'eslint';

import { getFilename, getOptionValue, isIgnoredFilename, normalizeArray } from '../utils/ast.js';
import { QUERY_RUNNER_FACTORY_TYPE_NAMES, receiverPassesTypeGate } from '../utils/types.js';

// A QueryRunner holds a dedicated connection out of the pool. If it is not
// released the connection never returns, and a handler that leaks one per
// request exhausts the pool and takes the service down. The release must sit in
// a `finally` block: releasing at the end of the happy path leaks the
// connection on every thrown error, which is exactly when it matters.
//
// The rule tracks `createQueryRunner()` results that are assigned to a name and
// looks for a `<name>.release()` call inside a `finally` in the same function.

const DEFAULT_METHODS = ['createQueryRunner'];
const DEFAULT_RELEASE_METHODS = ['release'];

function enclosingFunctionOrProgram(node: any): any {
  let current = node;
  while (current) {
    if (
      current.type === 'FunctionDeclaration' ||
      current.type === 'FunctionExpression' ||
      current.type === 'ArrowFunctionExpression' ||
      current.type === 'Program'
    ) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

interface ReleaseSearch {
  found: boolean;
  inFinally: boolean;
}

function isReleaseCall(node: any, name: string, releaseMethods: Set<string>): boolean {
  if (node?.type !== 'CallExpression') {
    return false;
  }
  const callee = node.callee;
  if (callee?.type !== 'MemberExpression' || callee.computed) {
    return false;
  }
  if (callee.property.type !== 'Identifier' || !releaseMethods.has(callee.property.name)) {
    return false;
  }
  return callee.object.type === 'Identifier' && callee.object.name === name;
}

// Walks the subtree tracking whether we are inside a `finally` block. Parent
// links are unreliable for nodes ESLint has not visited yet, so the flag is
// threaded down instead of walked back up.
function findRelease(
  node: any,
  name: string,
  releaseMethods: Set<string>,
  inFinally: boolean,
  result: ReleaseSearch,
): void {
  if (!node || typeof node.type !== 'string' || (result.found && result.inFinally)) {
    return;
  }

  if (isReleaseCall(node, name, releaseMethods)) {
    result.found = true;
    result.inFinally ||= inFinally;
    return;
  }

  for (const key of Object.keys(node)) {
    if (key === 'parent') {
      continue;
    }
    const value = node[key];
    const nowInFinally = inFinally || (node.type === 'TryStatement' && key === 'finalizer');

    if (Array.isArray(value)) {
      for (const child of value) {
        findRelease(child, name, releaseMethods, nowInFinally, result);
      }
    } else if (value && typeof value === 'object' && typeof value.type === 'string') {
      findRelease(value, name, releaseMethods, nowInFinally, result);
    }
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require a QueryRunner to be released in a finally block.',
      category: 'Possible Errors',
      recommended: true,
      url: 'https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/blob/main/docs/rules/require-query-runner-release.md',
    },
    schema: [
      {
        type: 'object',
        properties: {
          methods: { type: 'array', items: { type: 'string' } },
          releaseMethods: { type: 'array', items: { type: 'string' } },
          typeAware: { type: 'boolean' },
          ignorePatterns: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingRelease:
        'QueryRunner from "{{method}}" is never released. Call "{{name}}.release()" in a finally block or the connection leaks from the pool.',
      releaseOutsideFinally:
        'QueryRunner "{{name}}" is only released on the happy path. Move "{{name}}.release()" into a finally block so a thrown error cannot leak the connection.',
    },
  },
  create(context: any) {
    const options = context.options?.[0] ? context.options[0] : {};
    const methods = new Set(getOptionValue(options, 'methods', DEFAULT_METHODS));
    const releaseMethods = new Set(
      getOptionValue(options, 'releaseMethods', DEFAULT_RELEASE_METHODS),
    );
    const typeAware = options.typeAware === true;
    const ignorePatterns = normalizeArray(options.ignorePatterns);

    return {
      CallExpression(node: any) {
        if (isIgnoredFilename(getFilename(context), ignorePatterns)) {
          return;
        }

        const callee = node.callee;
        if (callee.type !== 'MemberExpression' || callee.computed) {
          return;
        }
        if (callee.property.type !== 'Identifier' || !methods.has(callee.property.name)) {
          return;
        }

        if (!receiverPassesTypeGate(context, callee.object, typeAware, QUERY_RUNNER_FACTORY_TYPE_NAMES)) {
          return;
        }

        // Only tracked when the runner is bound to a name we can follow.
        const declarator = node.parent;
        if (
          declarator?.type !== 'VariableDeclarator' ||
          declarator.init !== node ||
          declarator.id.type !== 'Identifier'
        ) {
          return;
        }

        const scope = enclosingFunctionOrProgram(declarator);
        if (!scope) {
          return;
        }

        const name = declarator.id.name;
        const result: ReleaseSearch = { found: false, inFinally: false };
        findRelease(scope, name, releaseMethods, false, result);

        if (result.inFinally) {
          return;
        }

        context.report({
          node,
          messageId: result.found ? 'releaseOutsideFinally' : 'missingRelease',
          data: { method: callee.property.name, name },
        });
      },
    };
  },
};

export default rule;
