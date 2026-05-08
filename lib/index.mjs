import noRawQuery from './rules/no-raw-query.mjs';

const plugin = {
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

export default plugin;
export { plugin };
