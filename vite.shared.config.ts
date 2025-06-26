import path from 'path';
import dts from 'vite-plugin-dts';

export function createLibraryConfig(options: {
  packageDir: string;
  entry?: string | Record<string, string>;
  external?: string[];
}) {
  const { packageDir, entry = 'src/index.ts', external = [] } = options;

  // Handle single entry or multiple entries
  const resolvedEntry =
    typeof entry === 'string'
      ? path.resolve(packageDir, entry)
      : Object.entries(entry).reduce(
          (acc, [key, value]) => {
            acc[key] = path.resolve(packageDir, value);
            return acc;
          },
          {} as Record<string, string>
        );

  return {
    plugins: [
      dts({
        insertTypesEntry: true,
        outDir: 'dist',
        tsconfigPath: './tsconfig.json',
        rollupTypes: true,
        copyDtsFiles: true,
      }),
    ],
    build: {
      lib: {
        entry: resolvedEntry,
        formats: ['es', 'cjs'],
        fileName: (format: string, entryName: string) => {
          const ext = format === 'es' ? 'js' : 'cjs';
          return entryName === 'index' ? `index.${ext}` : `${entryName}/index.${ext}`;
        },
      },
      rollupOptions: {
        // Ensure external packages are not bundled
        external: [
          '@openzeppelin/transaction-form-types',
          '@openzeppelin/transaction-form-utils',
          '@openzeppelin/transaction-form-react-core',
          '@openzeppelin/transaction-form-ui',
          'react',
          'react-dom',
          'react/jsx-runtime',
          /^node:/,
          ...external,
        ],
        output: [
          {
            format: 'es',
            preserveModules: true,
            preserveModulesRoot: 'src',
            entryFileNames: '[name].js',
            chunkFileNames: '[name].js',
            exports: 'named',
          },
          {
            format: 'cjs',
            preserveModules: true,
            preserveModulesRoot: 'src',
            entryFileNames: '[name].cjs',
            chunkFileNames: '[name].cjs',
            exports: 'named',
          },
        ],
      },
      sourcemap: true,
      target: 'esnext',
      minify: false, // Don't minify library code
    },
    resolve: {
      alias: {
        '@': path.resolve(packageDir, './src'),
      },
    },
  };
}
