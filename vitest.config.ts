import { aliasTs } from '@bemedev/vitest-alias';
import { exclude } from '@bemedev/vitest-exclude';
import { defineConfig } from 'vitest/config';
import tsconfig from './tsconfig.json';

export default defineConfig({
  plugins: [
    aliasTs(tsconfig as any),
    exclude({
      ignoreCoverageFiles: [
        '**/index.ts',
        '**/types.ts',
        '**/*.example.ts',
        '**/*.types.ts',
        '**/*.typegen.ts',
        '**/*.fixtures.ts',
        '**/experimental.ts',
        '**/fixtures.ts',
        '**/fixture.ts',
        '**/*.fixture.ts',
      ],
    }),
  ],
  test: {
    environment: 'node',
    globals: true,
    passWithNoTests: true,
    bail: 10,
    maxConcurrency: 10,
    logHeapUsage: true,

    coverage: {
      enabled: true,
      extension: 'ts',
      all: true,
      provider: 'v8',
      reportsDirectory: '.coverage',
    },
    typecheck: {
      enabled: true,
      ignoreSourceErrors: true,
    },
  },
});
