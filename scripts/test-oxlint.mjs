// Smoke test: run oxlint with the built plugin loaded via its JS-plugin API and
// assert our rules fire. oxlint exits non-zero when it finds errors, so a throw
// from execFileSync is the success path; we still verify the rule names appear.
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'tests', 'oxlint');

let output = '';
try {
  output = execFileSync('npx', ['--yes', 'oxlint', 'fixture.js'], { cwd: dir, encoding: 'utf8' });
  console.error('oxlint reported no violations — expected the fixture to fail.');
  process.exit(1);
} catch (error) {
  output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
}

const expected = [
  'typeorm-enterprise(no-raw-query)',
  'typeorm-enterprise(no-unsafe-query-builder-delete)',
];
const missing = expected.filter((needle) => !output.includes(needle));

if (missing.length > 0) {
  console.error(`oxlint smoke test failed. Missing: ${missing.join(', ')}\n\n${output}`);
  process.exit(1);
}

console.log('oxlint plugin smoke test passed — rules fire under oxlint.');
