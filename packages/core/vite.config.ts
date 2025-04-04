import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, searchForWorkspaceRoot } from 'vite';

// Restore custom plugins
import { crossPackageModulesProviderPlugin } from './vite-plugins/cross-package-provider';
import { virtualContentLoaderPlugin } from './vite-plugins/virtual-content-loader';
import templatePlugin from './vite.template-plugin';

/**
 * Configuration for virtual modules
 *
 * This defines which virtual modules should be created and their corresponding
 * source files in other packages. Add new entries here when you need to access
 * configuration from another package.
 *
 * For detailed documentation on this approach, see:
 * packages/core/src/docs/cross-package-imports.md
 */

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  // Use different configuration for dev vs build
  const isDevMode = command === 'serve';

  return {
    // Set Vite root based on mode - monorepo root for dev, package root for build
    root: isDevMode ? path.resolve(__dirname, '../..') : path.resolve(__dirname),
    plugins: [
      react(),
      // Restore custom plugins
      templatePlugin(),
      virtualContentLoaderPlugin(),
      crossPackageModulesProviderPlugin(),
    ],
    resolve: {
      preserveSymlinks: true,
      alias: {
        // Aliases relative from monorepo root
        '@': path.resolve(__dirname, './src'), // -> packages/core/src
        '@styles': path.resolve(__dirname, '../styles'), // -> packages/styles
        '@cross-package/form-renderer-config': path.resolve(
          __dirname,
          '../form-renderer/src/config.ts'
        ),
      },
    },
    server: {
      fs: {
        // Allow workspace root only; Vite should handle subdirs now
        allow: [searchForWorkspaceRoot(process.cwd())],
        strict: true,
      },
    },
    build: {
      // Adjust output directory relative to the new root
      outDir: path.resolve(__dirname, 'dist'),
      emptyOutDir: true,
    },
    // CSS config path relative from the new root
    css: {
      postcss: './postcss.config.cjs',
    },
    publicDir: path.resolve(__dirname, 'public'),
  };
});
