import type { Rule } from 'eslint';

import { getFilename, getOptionValue, isIgnoredFilename, normalizeArray } from '../utils/ast.js';
import { ENTITY_MANAGER_TYPE_NAMES, receiverMatchesTypes } from '../utils/types.js';

// Flags raw `.query()` (and configurable siblings) called on an EntityManager,
// whether obtained via `getManager()` / `getEntityManager()` or referenced
// through a `manager` / `entityManager` identifier. EntityManager.query bypasses
// the repository and query-builder layers entirely.
//
// With `{ typeAware: true }` and type information available (typescript-eslint
// parser + a project), the receiver is confirmed by its TypeScript type instead
// of its name, which removes false positives on unrelated `.query()` calls and
// catches EntityManagers under any variable name. Without type information it
// falls back to the name-based check.

const DEFAULT_METHODS = ['query'];
const DEFAULT_OBJECT_NAMES = ['manager', 'entityManager'];
const MANAGER_FACTORIES = new Set(['getManager', 'getEntityManager']);

function isManagerFactoryCall(node: any): boolean {
  if (node?.type !== 'CallExpression') {
    return false;
  }

  const callee = node.callee;
  if (callee.type === 'Identifier') {
    return MANAGER_FACTORIES.has(callee.name);
  }

  if (callee.type === 'MemberExpression' && !callee.computed && callee.property.type === 'Identifier') {
    return MANAGER_FACTORIES.has(callee.property.name);
  }

  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow raw queries executed directly on a TypeORM EntityManager.',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/blob/main/docs/rules/no-entity-manager-query.md',
    },
    schema: [
      {
        type: 'object',
        properties: {
          methods: { type: 'array', items: { type: 'string' } },
          objectNames: { type: 'array', items: { type: 'string' } },
          typeAware: { type: 'boolean' },
          ignorePatterns: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noEntityManagerQuery:
        'Avoid raw "{{method}}" on the EntityManager. Use a Repository or the QueryBuilder instead.',
    },
  },
  create(context: any) {
    const options = context.options?.[0] ? context.options[0] : {};
    const methods = new Set(getOptionValue(options, 'methods', DEFAULT_METHODS).map((m) => m.toLowerCase()));
    const objectNames = new Set(getOptionValue(options, 'objectNames', DEFAULT_OBJECT_NAMES));
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

        if (callee.property.type !== 'Identifier' || !methods.has(callee.property.name.toLowerCase())) {
          return;
        }

        const object = callee.object;
        const onManagerFactory = isManagerFactoryCall(object);
        let isManager = onManagerFactory;

        if (!isManager && typeAware) {
          const typed = receiverMatchesTypes(context, object, ENTITY_MANAGER_TYPE_NAMES);
          if (typed === null) {
            // No type information — fall back to the name-based check.
            isManager = object.type === 'Identifier' && objectNames.has(object.name);
          } else {
            isManager = typed;
          }
        } else if (!isManager) {
          isManager = object.type === 'Identifier' && objectNames.has(object.name);
        }

        if (!isManager) {
          return;
        }

        context.report({
          node,
          messageId: 'noEntityManagerQuery',
          data: { method: callee.property.name },
        });
      },
    };
  },
};

export default rule;
