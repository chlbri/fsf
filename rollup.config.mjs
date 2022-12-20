import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { minify } from 'rollup-plugin-esbuild';
import typescript from 'rollup-plugin-typescript2';

/**
 *
 * @returns {import('rollup').RollupOptions}
 */
const bundleDts = () => ({
  input: 'src/index.ts',
  plugins: [typescript(), minify(), nodeResolve(), commonjs()],
  external: ['@bemedev/x-guard', 'lodash.clonedeep'],
  output: [
    {
      format: 'es',
      file: 'lib/index.d.ts',
    },
    {
      format: 'cjs',
      sourcemap: 'inline',
      dir: `lib`,
      preserveModulesRoot: 'src',
      preserveModules: true,
      entryFileNames: '[name].js',
      exports: 'named',
    },
    {
      format: 'es',
      sourcemap: 'inline',
      dir: `lib`,
      preserveModulesRoot: 'src',
      preserveModules: true,
      entryFileNames: '[name].mjs',
      exports: 'named',
    },
  ],
});

const config = bundleDts();

export default config;
