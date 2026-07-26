// Syncs the package summary in AGENTS.md from llms.txt, between the
// LLMS:START / LLMS:END markers. llms.txt is the single source of truth for
// "what this package is"; AGENTS.md adds the repo-development instructions that
// coding agents (Claude Code, Codex, opencode, Cursor, ...) read automatically.
// Run with --check in CI to fail on drift.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const llmsPath = join(root, 'llms.txt');
const agentsPath = join(root, 'AGENTS.md');
const START = '<!-- LLMS:START -->';
const END = '<!-- LLMS:END -->';

// Demote llms.txt headings by one level so they nest under AGENTS.md's own
// "## Package summary" section, and drop its H1 (AGENTS.md has its own title).
const llms = readFileSync(llmsPath, 'utf8').trimEnd();
const body = llms
  .split('\n')
  .filter((line) => !line.startsWith('# '))
  .map((line) => (line.startsWith('##') ? `#${line}` : line))
  .join('\n')
  .trim();

const generated = [
  '<!-- Generated from llms.txt by scripts/sync-agents-md.mjs — do not edit by hand. -->',
  '',
  body,
].join('\n');

const agents = readFileSync(agentsPath, 'utf8');
const startIndex = agents.indexOf(START);
const endIndex = agents.indexOf(END);
if (startIndex === -1 || endIndex === -1) {
  console.error(`AGENTS.md is missing the ${START} / ${END} markers.`);
  process.exit(1);
}

const block = `${START}\n\n${generated}\n\n${END}`;
const next = agents.slice(0, startIndex) + block + agents.slice(endIndex + END.length);

if (process.argv.includes('--check')) {
  if (next !== agents) {
    console.error('AGENTS.md is out of sync with llms.txt. Run `npm run doc:agents`.');
    process.exit(1);
  }
  console.log('AGENTS.md is in sync with llms.txt.');
} else if (next !== agents) {
  writeFileSync(agentsPath, next);
  console.log('Updated AGENTS.md from llms.txt.');
} else {
  console.log('AGENTS.md already up to date.');
}
