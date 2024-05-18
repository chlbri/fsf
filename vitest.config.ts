import { aliasTs } from '@bemedev/vitest-alias';
import { defineConfig } from 'vitest/config';
import tsconfig from './tsconfig.json';

export default defineConfig({
  plugins: [aliasTs(tsconfig as any)],
  test: {
    environment: 'node',
    globals: true,

    coverage: {
      enabled: true,
      extension: 'ts',
      reportsDirectory: '.coverage',
      all: true,
      exclude: ['**/types.ts', '**/index.ts', '**/*.test-d.ts'],
      provider: 'v8',
      skipFull: true,
      
    },
  },
});
