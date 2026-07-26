import { test } from 'node:test';
import { RuleTester } from 'eslint';
import { join } from 'node:path';
import tseslint from 'typescript-eslint';

import plugin from '../dist/index.mjs';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  },
});

const released = `
async function save(user) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  try {
    await queryRunner.manager.save(user);
  } finally {
    await queryRunner.release();
  }
}`;

const releasedInNestedTry = `
async function save(user) {
  const qr = dataSource.createQueryRunner();
  try {
    try {
      await qr.manager.save(user);
    } catch (error) {
      throw error;
    }
  } finally {
    await qr.release();
  }
}`;

const missing = `
async function save(user) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.manager.save(user);
}`;

const happyPathOnly = `
async function save(user) {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.manager.save(user);
  await queryRunner.release();
}`;

const releasedInCatchOnly = `
async function save(user) {
  const qr = dataSource.createQueryRunner();
  try {
    await qr.manager.save(user);
  } catch (error) {
    await qr.release();
  }
}`;

test('require-query-runner-release', () => {
  ruleTester.run('require-query-runner-release', plugin.rules['require-query-runner-release'], {
    valid: [
      released,
      releasedInNestedTry,
      // Not bound to a name — nothing to track.
      'dataSource.createQueryRunner().connect();',
      // Unrelated factory.
      'const runner = jobs.createQueryRunner ? null : null;',
      'const worker = pool.createWorker();',
      // Bare and computed factory calls: no receiver to check.
      'const qr = createQueryRunner();',
      "const qr = dataSource['createQueryRunner']();",
      `const qr = this.dataSource.createQueryRunner();
       try { await qr.connect(); } finally { await qr.release(); }`,
      {
        code: missing,
        filename: join(process.cwd(), 'src', 'migrations', '1700000000-init.ts'),
        options: [{ ignorePatterns: ['**/migrations/**'] }],
      },
      {
        code: `const qr = dataSource.createQueryRunner();
               try { await qr.connect(); } finally { await qr.destroy(); }`,
        options: [{ releaseMethods: ['destroy'] }],
      },
    ],
    invalid: [
      {
        code: missing,
        errors: [
          {
            messageId: 'missingRelease',
            data: { method: 'createQueryRunner', name: 'queryRunner' },
          },
        ],
      },
      {
        code: happyPathOnly,
        errors: [
          {
            messageId: 'releaseOutsideFinally',
            data: { method: 'createQueryRunner', name: 'queryRunner' },
          },
        ],
      },
      {
        // A computed or bare `release` call does not count as releasing.
        code: `async function f() {
          const qr = dataSource.createQueryRunner();
          try { await qr.connect(); } finally { await qr['release'](); release(); }
        }`,
        errors: [{ messageId: 'missingRelease', data: { method: 'createQueryRunner', name: 'qr' } }],
      },
      {
        code: releasedInCatchOnly,
        errors: [{ messageId: 'releaseOutsideFinally', data: { method: 'createQueryRunner', name: 'qr' } }],
      },
      {
        // A different runner's release does not cover this one.
        code: `async function f() {
          const a = dataSource.createQueryRunner();
          const b = dataSource.createQueryRunner();
          try { await a.connect(); } finally { await a.release(); }
        }`,
        errors: [{ messageId: 'missingRelease', data: { method: 'createQueryRunner', name: 'b' } }],
      },
      {
        // Top-level (Program scope) is checked too.
        code: "const qr = dataSource.createQueryRunner();\nawait qr.connect();",
        errors: [{ messageId: 'missingRelease', data: { method: 'createQueryRunner', name: 'qr' } }],
      },
      {
        code: `const qr = dataSource.createQueryRunner();
               try { await qr.connect(); } finally { await qr.release(); }`,
        options: [{ releaseMethods: ['destroy'] }],
        errors: [{ messageId: 'missingRelease', data: { method: 'createQueryRunner', name: 'qr' } }],
      },
    ],
  });
});
