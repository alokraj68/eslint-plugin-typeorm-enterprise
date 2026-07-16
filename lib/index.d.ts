import type { Linter, Rule } from 'eslint';

declare const plugin: {
  rules: {
    'no-raw-query': Rule.RuleModule;
    'require-parameterized-query': Rule.RuleModule;
  };
  configs: {
    recommended: Linter.Config;
    warn: Linter.Config;
  };
};

export default plugin;
export { plugin };
