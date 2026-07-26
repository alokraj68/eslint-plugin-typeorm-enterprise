import type { ESLint, Linter, Rule } from 'eslint';

import noEntityManagerQuery from './rules/no-entity-manager-query.js';
import noInterpolatedWhere from './rules/no-interpolated-where.js';
import noRawQuery from './rules/no-raw-query.js';
import noSynchronizeTrue from './rules/no-synchronize-true.js';
import noUnsafeQueryBuilderDelete from './rules/no-unsafe-query-builder-delete.js';
import noUntypedRecordEscapeHatch from './rules/no-untyped-record-escape-hatch.js';
import preferExistsOverCount from './rules/prefer-exists-over-count.js';
import preferTransactionForMultipleWrites from './rules/prefer-transaction-for-multiple-writes.js';
import requireParameterizedQuery from './rules/require-parameterized-query.js';
import requireQueryRunnerRelease from './rules/require-query-runner-release.js';
import requireTenantScope from './rules/require-tenant-scope.js';
import requireTransaction from './rules/require-transaction.js';
import requireTypedQueryResult from './rules/require-typed-query-result.js';

const rules: Record<string, Rule.RuleModule> = {
  'no-raw-query': noRawQuery,
  'require-parameterized-query': requireParameterizedQuery,
  'no-synchronize-true': noSynchronizeTrue,
  'no-entity-manager-query': noEntityManagerQuery,
  'require-transaction': requireTransaction,
  'no-unsafe-query-builder-delete': noUnsafeQueryBuilderDelete,
  'no-interpolated-where': noInterpolatedWhere,
  'prefer-transaction-for-multiple-writes': preferTransactionForMultipleWrites,
  'require-tenant-scope': requireTenantScope,
  'prefer-exists-over-count': preferExistsOverCount,
  'require-typed-query-result': requireTypedQueryResult,
  'no-untyped-record-escape-hatch': noUntypedRecordEscapeHatch,
  'require-query-runner-release': requireQueryRunnerRelease,
};

// Broadly safe, low-false-positive rules enabled everywhere.
const RECOMMENDED_RULES = [
  'no-raw-query',
  'require-parameterized-query',
  'no-synchronize-true',
  'no-entity-manager-query',
  'no-unsafe-query-builder-delete',
  'no-interpolated-where',
  'require-query-runner-release',
];

// Heuristic / opinionated rules layered on top of recommended. The two
// query-result typing rules are strict-only on purpose: on a codebase that
// leans on raw queries they fire on nearly every call site, which is the right
// signal under `strict` but far too noisy for `recommended`.
const STRICT_RULES = [
  ...RECOMMENDED_RULES,
  'require-transaction',
  'prefer-transaction-for-multiple-writes',
  'require-typed-query-result',
  'no-untyped-record-escape-hatch',
];

// Performance-tuning warnings.
const PERFORMANCE_RULES = ['prefer-exists-over-count'];

// Multi-tenant guards on top of recommended.
const MULTI_TENANT_RULES = [...RECOMMENDED_RULES, 'require-tenant-scope'];

type Severity = 'error' | 'warn';

function buildRuleSettings(ruleNames: string[], severity: Severity): Linter.RulesRecord {
  const entries = ruleNames.map((name) => [`typeorm-enterprise/${name}`, severity] as const);
  return Object.fromEntries(entries);
}

// Whether a rule accepts `{ typeAware: true }`, read from its own schema so a
// new rule joins the type-checked config by declaring the option and nothing
// else.
function supportsTypeAware(name: string): boolean {
  const schema = rules[name]?.meta?.schema;
  const first = Array.isArray(schema) ? schema[0] : undefined;
  return Boolean((first as any)?.properties?.typeAware);
}

// Same rules as `strict`, but every rule that can use TypeScript type
// information is told to. Requires the typescript-eslint parser with a project
// or projectService; rules fall back to their AST-only behavior if it is
// missing, so this config is safe to enable ahead of the parser setup.
function buildTypeCheckedSettings(ruleNames: string[], severity: Severity): Linter.RulesRecord {
  const entries = ruleNames.map((name) => {
    const setting: Linter.RuleEntry = supportsTypeAware(name)
      ? [severity, { typeAware: true }]
      : severity;
    return [`typeorm-enterprise/${name}`, setting] as const;
  });
  return Object.fromEntries(entries);
}

const plugin: ESLint.Plugin = {
  meta: {
    // Also used by oxlint as the rule prefix, so keep it aligned with the
    // `typeorm-enterprise/...` names used across configs and docs.
    name: 'typeorm-enterprise',
  },
  rules,
};

function config(ruleNames: string[], severity: Severity) {
  return {
    plugins: { 'typeorm-enterprise': plugin },
    rules: buildRuleSettings(ruleNames, severity),
  };
}

function typeCheckedConfig(ruleNames: string[], severity: Severity) {
  return {
    plugins: { 'typeorm-enterprise': plugin },
    rules: buildTypeCheckedSettings(ruleNames, severity),
  };
}

plugin.configs = {
  recommended: config(RECOMMENDED_RULES, 'error'),
  warn: config(RECOMMENDED_RULES, 'warn'),
  strict: config(STRICT_RULES, 'error'),
  strictTypeChecked: typeCheckedConfig(STRICT_RULES, 'error'),
  recommendedTypeChecked: typeCheckedConfig(RECOMMENDED_RULES, 'error'),
  performance: config(PERFORMANCE_RULES, 'warn'),
  multiTenant: config(MULTI_TENANT_RULES, 'error'),
};

export default plugin;
export { plugin };
