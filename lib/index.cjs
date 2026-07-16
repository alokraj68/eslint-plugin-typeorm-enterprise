'use strict';

const noRawQuery = require('./rules/no-raw-query.cjs');
const requireParameterizedQuery = require('./rules/require-parameterized-query.cjs');

const rules = {
  'no-raw-query': noRawQuery,
  'require-parameterized-query': requireParameterizedQuery,
};

function buildConfig(severity) {
  return {
    plugins: ['typeorm-enterprise'],
    rules: {
      'typeorm-enterprise/no-raw-query': severity,
      'typeorm-enterprise/require-parameterized-query': severity,
    },
  };
}

module.exports = {
  rules,
  configs: {
    recommended: buildConfig('error'),
    warn: buildConfig('warn'),
  },
};
