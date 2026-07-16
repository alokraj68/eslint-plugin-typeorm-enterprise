import noRawQuery from './rules/no-raw-query.mjs';
import requireParameterizedQuery from './rules/require-parameterized-query.mjs';

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

const plugin = {
  rules,
  configs: {
    recommended: buildConfig('error'),
    warn: buildConfig('warn'),
  },
};

export default plugin;
export { plugin };
