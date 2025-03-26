import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

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
const crossPackageModules: Record<string, string> = {
  // Map of virtual module ID to actual file path (relative to project root)
  'virtual:form-renderer-config': '../form-renderer/src/config.ts',
  // Add more cross-package modules here as needed, for example:
  // 'virtual:templates-config': '../templates/src/config.ts',
  // 'virtual:adapters-manager': '../adapters/src/manager.ts',
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    templatePlugin(),

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
     * We create virtual modules that can import across package boundaries using Vite's alias
     * system, which works consistently in both development and production modes.
     *
     * HOW IT WORKS:
     * 1. When code imports from a virtual module (e.g. 'virtual:form-renderer-config'),
     *    this plugin intercepts the request
     * 2. It returns a small module that imports from the aliased path
     * 3. This avoids the path resolution issues that affect import.meta.glob in development
     *
     * BENEFITS:
     * - Works consistently in both development and production
     * - Preserves build-time optimizations (no runtime filesystem operations)
     * - Avoids hardcoding configuration values
     * - Maintains type safety with proper TypeScript declarations
     *
     * TO ADD A NEW CROSS-PACKAGE IMPORT:
     * 1. Add an entry to the 'crossPackageModules' object above
     * 2. Add a corresponding alias in the 'resolve.alias' section below
     * 3. Create a type declaration in 'packages/core/src/types/virtual-modules.d.ts'
     */
    {
      name: 'cross-package-modules-provider',
      resolveId(id: string) {
        // Check if this is one of our virtual modules
        if (id in crossPackageModules) {
          return `\0${id}`;
        }
        return null;
      },
      load(id: string) {
        // Extract the original ID without the null byte prefix
        const originalId = id.startsWith('\0') ? id.slice(1) : id;

        if (originalId in crossPackageModules) {
          // Get the module ID to create an appropriate alias key
          const moduleKey = originalId.replace('virtual:', '');
          // Create an alias that matches the one defined in resolve.alias
          const aliasKey = `@cross-package/${moduleKey}`;

          // Generate a module that imports and re-exports from the aliased path
          // We use a simplified approach to avoid dynamic export syntax which is not valid
          return `
            import * as _module from '${aliasKey}';
            
            // Re-export all named exports
            export const formRendererConfig = _module.formRendererConfig;
            
            // Re-export any other known exports here as needed
            
            // Re-export default if it exists
            export default _module.default;
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
      '@styles': path.resolve(__dirname, '../styles'),

      // Cross-package aliases for virtual modules
      // These are used by the virtual modules to import the actual files
      '@cross-package/form-renderer-config': path.resolve(
        __dirname,
        '../form-renderer/src/config.ts'
      ),
      // Add more aliases for other configurations as needed
      // '@cross-package/templates-config': path.resolve(__dirname, '../templates/src/config.ts'),
    },
  },
  build: {
    outDir: 'dist',
  },
});
