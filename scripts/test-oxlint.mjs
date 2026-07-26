// Smoke test: run oxlint with the built plugin loaded via its JS-plugin API and
// assert our rules fire. oxlint exits non-zero when it finds errors, so a throw
// from execFileSync is the success path; we still verify the rule names appear.
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'tests', 'oxlint');

// Run the locally installed oxlint through its Node entry point rather than the
// `npx` shim: on Windows the shim is a .cmd file, which execFileSync refuses to
// spawn (EINVAL), and going through node keeps the run offline and pinned to the
// devDependency version.
const require = createRequire(import.meta.url);
const oxlintBin = join(dirname(require.resolve('oxlint/package.json')), 'bin', 'oxlint');

let output = '';
try {
  output = execFileSync(process.execPath, [oxlintBin, 'fixture.js', 'fixture.ts'], {
    cwd: dir,
    encoding: 'utf8',
  });
  console.error('oxlint reported no violations — expected the fixture to fail.');
  process.exit(1);
} catch (error) {
  output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
}

const expected = [
  'typeorm-enterprise(no-raw-query)',
  'typeorm-enterprise(no-unsafe-query-builder-delete)',
  'typeorm-enterprise(require-typed-query-result)',
  'typeorm-enterprise(no-untyped-record-escape-hatch)',
  'typeorm-enterprise(require-query-runner-release)',
];
const missing = expected.filter((needle) => !output.includes(needle));

if (missing.length > 0) {
  console.error(`oxlint smoke test failed. Missing: ${missing.join(', ')}\n\n${output}`);
  process.exit(1);
}

console.log('oxlint plugin smoke test passed — rules fire under oxlint.');
