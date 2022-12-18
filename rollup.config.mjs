/* eslint-disable @typescript-eslint/no-var-requires */

import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import { terser } from 'rollup-plugin-terser';
import tsConfigPaths from 'rollup-plugin-tsconfig-paths';

/** @type {(value: string) => import('rollup').RollupOptions} */
const bundleDts = value => ({
  input: `src/${value}.ts`,
  external: id => !/^[./]/.test(id),
  plugins: [dts()],
  output: {
    format: 'es',
    file: `lib/${value}.d.ts`,
  },
});

/** @type {(value: string) => import('rollup').RollupOptions} */
const bundleJS = value => {
  return {
    input: `src/${value}.ts`,
    external: ['@bemedev/x-guard'],
    plugins: [esbuild(), terser({}), tsConfigPaths()],
    output: [
      {
        format: 'cjs',
        sourcemap: true,
        dir: `lib`,
        preserveModulesRoot: 'src',
        preserveModules: true,
        entryFileNames: '[name].js',
        exports: 'named',
      },
      {
        format: 'es',
        sourcemap: true,
        dir: `lib`,
        preserveModulesRoot: 'src',
        preserveModules: true,
        entryFileNames: '[name].mjs',
        exports: 'named',
      },
    ],
  };
};

/** @type {(...values: string[]) => import('rollup').RollupOptions[]} */
const bundles = (...values) => {
  const types = values.map(bundleDts);
  const jss = values.map(bundleJS);
  const out = [...types, ...jss];
  return out;
};

const config = bundles(
  'helpers/index',
  'index',
  'createFunction',
  'interpret',
);

export default config;
