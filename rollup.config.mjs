import tsConfigPaths from 'rollup-plugin-tsconfig-paths';
import typescript from 'rollup-plugin-typescript2';

/**
 *
 * @returns {import('rollup').RollupOptions}
 */
const bundleDts = () => ({
  input: 'src/index.ts',
  plugins: [typescript(), tsConfigPaths()],
  external: ['@bemedev/x-guard', 'deepmerge'],
  output: [
    {
      format: 'es',
      file: 'lib/index.d.ts',
    },
    {
      format: 'cjs',
      sourcemap: true,
      dir: `lib`,
      preserveModulesRoot: 'src',
      preserveModules: true,
      entryFileNames: '[name].js',
    },
    {
      format: 'es',
      sourcemap: true,
      dir: `lib`,
      preserveModulesRoot: 'src',
      preserveModules: true,
      entryFileNames: '[name].mjs',
    },
  ],
});

const config = bundleDts();

export default config;
