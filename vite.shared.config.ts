import path from 'path';
import type { OutputBundle, OutputOptions, Plugin } from 'vite';
import dts from 'vite-plugin-dts';

// Plugin to ensure ES modules use explicit .js extensions
function esModuleImportFixer(): Plugin {
  return {
    name: 'es-module-import-fixer',
    generateBundle(options: OutputOptions, bundle: OutputBundle) {
      if (options.format !== 'es') return;

      Object.values(bundle).forEach((chunk) => {
        if (chunk.type === 'chunk' && chunk.code) {
          // Fix all relative imports/exports to use explicit extensions
          chunk.code = chunk.code.replace(
            /((?:from|import|export\s+\*\s+from)\s+['"])(\.\/[^'"]+)(['"])/g,
            (match, prefix, importPath, suffix) => {
              // Skip if already has an extension
              if (importPath.match(/\.\w+$/)) return match;
              // Check if the path exists as a file with common extensions
              const hasKnownExtension = importPath.match(/\.(js|ts|jsx|tsx|mjs|cjs)$/);
              if (hasKnownExtension) return match;
              // Add /index.js to directory imports
              return `${prefix}${importPath}/index.js${suffix}`;
            }
          );

          // Convert side-effect imports to re-exports in index files
          if (chunk.fileName.endsWith('index.js')) {
            chunk.code = chunk.code.replace(
              /^import\s+['"](.\/[^'"]+)['"];$/gm,
              "export * from '$1';"
            );
          }
        }
      });
    },
  };
}

export function createLibraryConfig(options: {
  packageDir: string;
  entry?: string | Record<string, string>;
  external?: string[];
}) {
  const { packageDir, entry = 'src/index.ts', external = [] } = options;

  // Normalize entry to always be an object
  const entries = typeof entry === 'string' ? { index: entry } : entry;

  const resolvedEntries = Object.entries(entries).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: path.resolve(packageDir, value),
    }),
    {}
  );

  return {
    plugins: [
      dts({
        insertTypesEntry: true,
        outDir: 'dist',
        rollupTypes: false, // Keep directory structure for types
      }),
      esModuleImportFixer(),
    ],
    build: {
      lib: {
        entry: resolvedEntries,
        formats: ['es', 'cjs'],
      },
      rollupOptions: {
        external: [
          // Match all @openzeppelin packages
          /^@openzeppelin\//,
          // React-related
          'react',
          'react-dom',
          'react/jsx-runtime',
          // Node built-ins
          /^node:/,
          // Additional externals
          ...external,
        ],
        treeshake: false, // Preserve all exports for libraries
        output: ['es', 'cjs'].map((format) => ({
          format,
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: `[name].${format === 'es' ? 'js' : 'cjs'}`,
          chunkFileNames: `[name].${format === 'es' ? 'js' : 'cjs'}`,
          exports: 'named',
        })),
      },
      sourcemap: true,
      target: 'esnext',
      minify: false,
    },
    resolve: {
      alias: {
        '@': path.resolve(packageDir, './src'),
      },
    },
  };
}
