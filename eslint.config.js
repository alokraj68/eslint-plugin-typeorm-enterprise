module.exports = {
  plugins: {
    'typeorm-enterprise': require('./lib'),
  },
  rules: {
    'typeorm-enterprise/no-raw-query': 'error',
  },
};
