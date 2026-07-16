import type { ESLint, Linter, Rule } from 'eslint';

import noEntityManagerQuery from './rules/no-entity-manager-query.js';
import noInterpolatedWhere from './rules/no-interpolated-where.js';
import noRawQuery from './rules/no-raw-query.js';
import noSynchronizeTrue from './rules/no-synchronize-true.js';
import noUnsafeQueryBuilderDelete from './rules/no-unsafe-query-builder-delete.js';
import preferExistsOverCount from './rules/prefer-exists-over-count.js';
import preferTransactionForMultipleWrites from './rules/prefer-transaction-for-multiple-writes.js';
import requireParameterizedQuery from './rules/require-parameterized-query.js';
import requireTenantScope from './rules/require-tenant-scope.js';
import requireTransaction from './rules/require-transaction.js';

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
};

// Broadly safe, low-false-positive rules enabled everywhere.
const RECOMMENDED_RULES = [
  'no-raw-query',
  'require-parameterized-query',
  'no-synchronize-true',
  'no-entity-manager-query',
  'no-unsafe-query-builder-delete',
  'no-interpolated-where',
];

// Heuristic / opinionated rules layered on top of recommended.
const STRICT_RULES = [
  ...RECOMMENDED_RULES,
  'require-transaction',
  'prefer-transaction-for-multiple-writes',
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

plugin.configs = {
  recommended: config(RECOMMENDED_RULES, 'error'),
  warn: config(RECOMMENDED_RULES, 'warn'),
  strict: config(STRICT_RULES, 'error'),
  performance: config(PERFORMANCE_RULES, 'warn'),
  multiTenant: config(MULTI_TENANT_RULES, 'error'),
};

export default plugin;
export { plugin };
