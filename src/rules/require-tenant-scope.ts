import type { Rule } from 'eslint';

import { getFilename, getOptionValue, isIgnoredFilename } from '../utils/ast.js';

// Multi-tenant guard. Flags repository / query-builder read and write calls that
// do not reference a configured tenant key anywhere in the call, so cross-tenant
// data access is caught at lint time. Heuristic and project-specific — it is not
// in `recommended`; enable it via the `multiTenant` config or directly, and set
// `tenantKeys` to match your schema.

const DEFAULT_TENANT_KEYS = ['tenantId', 'tenant_id', 'organizationId', 'organization_id', 'orgId'];
const DEFAULT_METHODS = [
  'find',
  'findone',
  'findoneby',
  'findandcount',
  'findby',
  'update',
  'delete',
  'softdelete',
  'remove',
  'count',
];

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require tenant-scoped access on TypeORM read and write operations (multi-tenant).',
      category: 'Best Practices',
      recommended: false,
      url: 'https://github.com/alokraj68/eslint-plugin-typeorm-enterprise/blob/main/docs/rules/require-tenant-scope.md',
    },
    schema: [
      {
        type: 'object',
        properties: {
          tenantKeys: { type: 'array', items: { type: 'string' } },
          methods: { type: 'array', items: { type: 'string' } },
          ignorePatterns: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingTenant:
        'Operation "{{method}}" does not reference a tenant key ({{keys}}). Scope the query to the current tenant to prevent cross-tenant access.',
    },
  },
  create(context: any) {
    const options = context.options?.[0] ? context.options[0] : {};
    const tenantKeys = getOptionValue(options, 'tenantKeys', DEFAULT_TENANT_KEYS);
    const methods = new Set(getOptionValue(options, 'methods', DEFAULT_METHODS).map((m) => m.toLowerCase()));
    const ignorePatterns = getOptionValue(options, 'ignorePatterns', []);
    const sourceCode = context.sourceCode ?? context.getSourceCode?.();
    const loweredKeys = tenantKeys.map((key) => key.toLowerCase());

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

        const text = (sourceCode?.getText ? sourceCode.getText(node) : '').toLowerCase();
        const hasTenantKey = loweredKeys.some((key) => text.includes(key));
        if (hasTenantKey) {
          return;
        }

        context.report({
          node,
          messageId: 'missingTenant',
          data: { method, keys: tenantKeys.join(', ') },
        });
      },
    };
  },
};

export default rule;
