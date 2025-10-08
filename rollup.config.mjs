import { defineConfig } from '@bemedev/rollup-config';

export default defineConfig({
  declarationMap: true,
  ignoresJS: ['**/*.types.ts', 'src/types/*.ts'],
  sourcemap: true,
});
