import type { Plugin } from 'vite';

/**
 * Configuration for cross-package virtual modules (which require alias resolution)
 */
const crossPackageModules: Record<string, string> = {
  'virtual:form-renderer-config': '../form-renderer/src/config.ts',
  // Add more alias-based virtual modules here if needed
};

/**
 * Plugin to provide cross-package module imports via aliases.
 *
 * This plugin intercepts imports for specified virtual modules
 * (like 'virtual:form-renderer-config') and returns a small module
 * that imports the actual target file using a Vite alias (like
 * '@cross-package/form-renderer-config').
 *
 * This is necessary because direct cross-package imports can be unreliable
 * in Vite's dev server.
 *
 * Requires corresponding aliases to be defined in the main vite config's
 * `resolve.alias` section (e.g., '@cross-package/form-renderer-config': path.resolve(...)).
 */
export function crossPackageModulesProviderPlugin(): Plugin {
  return {
    name: 'cross-package-modules-provider',
    resolveId(id: string) {
      if (id in crossPackageModules) {
        return `\0${id}`; // Mark as resolved virtual module
      }
      return null;
    },
    load(id: string) {
      const originalId = id.startsWith('\0') ? id.slice(1) : id;
      if (originalId in crossPackageModules) {
        const moduleKey = originalId.replace('virtual:', '');
        const aliasKey = `@cross-package/${moduleKey}`;
        // Generate module that re-exports from the alias
        // IMPORTANT: Add specific named exports as needed!
        return `
          import * as _module from '${aliasKey}';
          // Re-export known named exports
          export const formRendererConfig = _module.formRendererConfig;
          // Add other exports here if the target module has more...
        `;
      }
      return null;
    },
  };
}
