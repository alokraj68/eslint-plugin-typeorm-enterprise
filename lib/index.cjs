'use strict';
const noRawQuery = require('./rules/no-raw-query.cjs');

module.exports = {
  rules: {
    'no-raw-query': noRawQuery,
  },
  configs: {
    recommended: {
      plugins: ['typeorm-enterprise'],
      rules: {
        'typeorm-enterprise/no-raw-query': 'error',
      },
    },
  },
};
