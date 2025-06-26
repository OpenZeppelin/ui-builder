import path from 'path';
import type { OutputBundle, OutputOptions, Plugin } from 'vite';
import dts from 'vite-plugin-dts';

// Custom plugin to fix directory imports for ES modules
function fixDirectoryImports(): Plugin {
  return {
    name: 'fix-directory-imports',
    generateBundle(options: OutputOptions, bundle: OutputBundle) {
      // Only apply to ES format
      if (options.format !== 'es') return;

      for (const fileName in bundle) {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk' && chunk.code) {
          // Replace directory imports with explicit index.js imports
          chunk.code = chunk.code.replace(
            /from\s+['"](\.\/[^'"]+)['"];/g,
            (match: string, importPath: string) => {
              // Skip if already has an extension
              if (importPath.includes('.')) return match;
              // Add /index.js to directory imports
              return match.replace(importPath, `${importPath}/index.js`);
            }
          );

          // Also handle export * from syntax
          chunk.code = chunk.code.replace(
            /export\s+\*\s+from\s+['"](\.\/[^'"]+)['"];/g,
            (match: string, importPath: string) => {
              // Skip if already has an extension
              if (importPath.includes('.')) return match;
              // Add /index.js to directory imports
              return match.replace(importPath, `${importPath}/index.js`);
            }
          );

          // Fix imports that should be re-exports
          // Look for patterns where we have import './something' that should be export * from './something'
          if (fileName.endsWith('index.js')) {
            chunk.code = chunk.code.replace(
              /^import\s+['"](\.\/[^'"]+)['"];$/gm,
              (match: string, importPath: string) => {
                // Convert side-effect imports to re-exports for index files
                return `export * from '${importPath}';`;
              }
            );
          }
        }
      }
    },
  };
}

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
        rollupTypes: false,
        copyDtsFiles: true,
      }),
      fixDirectoryImports(),
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
        treeshake: false, // Disable tree shaking to preserve all exports
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
