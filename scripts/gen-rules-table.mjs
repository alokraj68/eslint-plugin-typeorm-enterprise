// Regenerates the rules table in README.md between the RULES:START / RULES:END
// markers, from the built plugin's rule metadata. Run with --check in CI to fail
// on drift. Also verifies every rule has a docs/rules/<name>.md file.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import plugin from '../dist/index.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readmePath = join(root, 'README.md');
const START = '<!-- RULES:START -->';
const END = '<!-- RULES:END -->';

const configs = plugin.configs;
const inConfig = (name, config) =>
  Object.hasOwn(config.rules, `typeorm-enterprise/${name}`);

function configLabel(name) {
  if (inConfig(name, configs.recommended)) return '✅ recommended';
  if (inConfig(name, configs.multiTenant) && !inConfig(name, configs.recommended)) return '🏢 multiTenant';
  if (inConfig(name, configs.performance)) return '🚀 performance';
  if (inConfig(name, configs.strict)) return '⚠️ strict';
  return '—';
}

const rows = Object.entries(plugin.rules).map(([name, rule]) => {
  const description = rule.meta?.docs?.description ?? '';
  const fixable = rule.meta?.fixable ? '🔧' : '';
  const link = `[\`${name}\`](./docs/rules/${name}.md)`;
  return `| ${link} | ${description} | ${fixable} | ${configLabel(name)} |`;
});

const table = [
  '| Rule | Description | 🔧 | Config |',
  '|---|---|:--:|:--:|',
  ...rows,
].join('\n');

const block = `${START}\n\n${table}\n\n${END}`;

// Verify each rule has a docs file.
const missingDocs = Object.keys(plugin.rules).filter(
  (name) => !existsSync(join(root, 'docs', 'rules', `${name}.md`)),
);
if (missingDocs.length > 0) {
  console.error(`Missing docs/rules for: ${missingDocs.join(', ')}`);
  process.exit(1);
}

const readme = readFileSync(readmePath, 'utf8');
const pattern = new RegExp(String.raw`${START}[\s\S]*?${END}`);
if (!pattern.test(readme)) {
  console.error(`README.md is missing the ${START} / ${END} markers.`);
  process.exit(1);
}

const updated = readme.replace(pattern, block);
const isCheck = process.argv.includes('--check');

if (isCheck) {
  if (updated !== readme) {
    console.error('README rules table is out of date. Run: npm run doc');
    process.exit(1);
  }
  console.log('Rules table is up to date.');
} else {
  writeFileSync(readmePath, updated);
  console.log('README rules table updated.');
}
