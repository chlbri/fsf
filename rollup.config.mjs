import { globSync } from 'glob';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'rollup';
import tscAlias from 'rollup-plugin-tsc-alias';
import typescript from 'rollup-plugin-typescript2';

const input = Object.fromEntries(
  globSync('./src/**/*.ts', {
    ignore: [
      '**/*.test.ts',
      '**/*.test-d.ts',
      '**/*.fixtures.ts',
      './src/config/**/*.ts',
      './src/types/**/*.ts',
      './src/**/*types.ts',
    ],
  }).map(file => [
    // This remove `src/` as well as the file extension from each
    // file, so e.g. src/nested/foo.js becomes nested/foo
    path.relative(
      'src',
      file.slice(0, file.length - path.extname(file).length),
    ),
    // This expands the relative paths to absolute paths, so e.g.
    // src/nested/foo becomes /project/src/nested/foo.js
    fileURLToPath(new URL(file, import.meta.url)),
  ]),
);

export default defineConfig({
  input,

  plugins: [
    typescript({
      tsconfigOverride: {
        exclude: [
          '**/*.test.ts',
          '**/*.test-d.ts',
          'src/fixtures',
          'src/config',
          // 'src/types.ts',
        ],
      },
      check: false,
    }),
    tscAlias({}),
  ],
  external: [
    '@bemedev/x-guard',
    'deepmerge',
    
  ],

  output: [
    {
      format: 'cjs',
      sourcemap: true,
      dir: `lib`,
      preserveModulesRoot: 'src',
      preserveModules: true,

      entryFileNames: '[name].cjs',
    },
    {
      format: 'es',
      sourcemap: true,
      dir: `lib`,
      preserveModulesRoot: 'src',
      preserveModules: true,
      entryFileNames: '[name].js',
    },
  ],
});
