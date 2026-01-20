import type { Plugin } from 'vite';

/**
 * Plugin to provide virtual module imports for renderer config.
 *
 * This plugin intercepts imports for 'virtual:renderer-config' and
 * re-exports the rendererConfig from the @openzeppelin/ui-renderer npm package.
 */
export function crossPackageModulesProviderPlugin(): Plugin {
  return {
    name: 'cross-package-modules-provider',
    resolveId(id: string) {
      if (id === 'virtual:renderer-config') {
        return `\0${id}`; // Mark as resolved virtual module
      }
      return null;
    },
    load(id: string) {
      const originalId = id.startsWith('\0') ? id.slice(1) : id;
      if (originalId === 'virtual:renderer-config') {
        // Re-export rendererConfig from the npm package
        return `
          export { rendererConfig } from '@openzeppelin/ui-renderer';
        `;
      }
      return null;
    },
  };
}
