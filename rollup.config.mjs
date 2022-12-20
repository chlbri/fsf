import babel from '@rollup/plugin-babel';
import tsConfigPaths from 'rollup-plugin-tsconfig-paths';
import typescript from 'rollup-plugin-typescript2';

/**
 *
 * @returns {import('rollup').RollupOptions}
 */
const bundleDts = () => ({
  input: 'src/index.ts',
  plugins: [
    typescript(),
    tsConfigPaths(),
    babel({
      babelrc: false,
      configFile: false,
      skipPreflightCheck: true,
      babelHelpers: 'inline',
      extensions: ['.ts', '.tsx', '.js'],
      plugins: ['babel-plugin-annotate-pure-calls'],
    }),
  ],
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
