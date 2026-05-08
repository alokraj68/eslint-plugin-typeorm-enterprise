import type { Linter, Rule } from 'eslint';

declare const plugin: {
  rules: {
    'no-raw-query': Rule.RuleModule;
  };
  configs: {
    recommended: Linter.Config;
  };
};

export default plugin;
export { plugin };
