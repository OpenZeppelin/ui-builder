import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    /**
     * CROSS-PACKAGE CONFIGURATION PROVIDER
     *
     * This plugin addresses a specific limitation in Vite's development server related to
     * cross-package imports using import.meta.glob.
     *
     * THE PROBLEM:
     * In development mode, import.meta.glob cannot reliably resolve paths that cross package
     * boundaries in a monorepo. This causes the following error when trying to export forms:
     * "Export failed: No form renderer configuration file found"
     *
     * SOLUTION:
     * We create a virtual module that can import across package boundaries using Vite's alias
     * system, which works consistently in both development and production modes.
     *
     * HOW IT WORKS:
     * 1. When code imports from 'virtual:form-renderer-config', this plugin intercepts the request
     * 2. It returns a small module that imports from '@form-renderer/config' (aliased below)
     * 3. This avoids the path resolution issues that affect import.meta.glob in development
     *
     * BENEFITS:
     * - Works consistently in both development and production
     * - Preserves build-time optimizations (no runtime filesystem operations)
     * - Avoids hardcoding configuration values
     * - Maintains type safety with proper TypeScript declarations
     *
     * This approach is recommended by the Vite team for cases where consistent module
     * resolution is needed between dev and build modes.
     */
    {
      name: 'form-renderer-config-provider',
      resolveId(id) {
        // Intercept requests for our virtual module
        if (id === 'virtual:form-renderer-config') {
          return '\0virtual:form-renderer-config';
        }
        return null;
      },
      load(id) {
        if (id === '\0virtual:form-renderer-config') {
          // Create a module that dynamically loads the configuration
          // using the @form-renderer/config alias defined below
          return `
            import * as formRendererConfigModule from '@form-renderer/config';
            export const formRendererConfig = formRendererConfigModule.formRendererConfig;
          `;
        }
        return null;
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@form-renderer': path.resolve(__dirname, '../form-renderer/src'),
      // This specific alias enables the virtual module to import the config file
      // from another package in the monorepo, which is crucial for the plugin above
      '@form-renderer/config': path.resolve(__dirname, '../form-renderer/src/config.ts'),
      '@styles': path.resolve(__dirname, '../styles'),
    },
  },
  build: {
    outDir: 'dist',
  },
});
