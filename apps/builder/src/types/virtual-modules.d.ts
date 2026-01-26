/**
 * TYPE DECLARATIONS FOR VIRTUAL MODULES
 *
 * This file provides TypeScript type definitions for virtual modules used in the project.
 * Virtual modules are special modules that don't exist as real files on disk but are
 * created at runtime by Vite plugins.
 *
 * For detailed documentation on this approach, see:
 * apps/builder/src/docs/cross-package-imports.md
 *
 * HOW TO ADD A NEW VIRTUAL MODULE:
 *
 * 1. Add the module to crossPackageModules in vite.config.ts
 * 2. Add a corresponding alias in resolve.alias in vite.config.ts
 * 3. Add a type declaration here following the pattern below
 * 4. Add a matching mock implementation in vitest.config.ts for testing
 */

/**
 * FORM RENDERER CONFIGURATION VIRTUAL MODULE
 *
 * This module declaration makes TypeScript aware of the 'virtual:renderer-config' import,
 * which is provided by the 'cross-package-modules-provider' plugin in vite.config.ts.
 *
 * WHY IT'S NEEDED:
 * Without this declaration, TypeScript would report an error about the module not being found,
 * even though Vite can resolve it at runtime through the plugin.
 *
 * USED BY:
 * This module is imported by apps/builder/src/export/PackageManager.ts to access
 * the renderer configuration for dependency management during form export.
 */
declare module 'virtual:renderer-config' {
  import type { RendererConfig } from '@openzeppelin/ui-renderer';
  export const rendererConfig: RendererConfig;
}

/**
 * ADD NEW VIRTUAL MODULE DECLARATIONS BELOW
 *
 * If you need to access configuration from another package, add your
 * module declaration here following this pattern:
 *
 * ```
 * declare module 'virtual:module-name' {
 *   // Import the types you need
 *   import type { SomeType } from '@package/types';
 *
 *   // Declare what's exported from the module
 *   export const someConfig: SomeType;
 *   // or with a default export
 *   export default SomeClass;
 * }
 * ```
 */

// Example of how to add another module:
// declare module 'virtual:export-templates-config' {
//   import type { ExportOptions } from '../core/types/ExportTypes';
//   export const templateConfig: Record<string, ExportOptions>;
// }

/**
 * Declaration merging for RendererConfig types
 *
 * This declaration allows importing types like RendererConfig using the
 * deep import path `@openzeppelin/ui-renderer/types/RendererConfig`.
 * Types are re-exported from the main package entry point.
 */
declare module '@openzeppelin/ui-renderer/types/RendererConfig' {
  // Re-export types from the main package (not /types sub-path which doesn't exist)
  export type { RendererConfig } from '@openzeppelin/ui-renderer';
}

// Add declarations for the raw config content virtual modules
declare module 'virtual:tailwind-config-content' {
  const content: string;
  export default content;
}

declare module 'virtual:postcss-config-content' {
  const content: string;
  export default content;
}

declare module 'virtual:components-json-content' {
  const content: string;
  export default content;
}

// Add declarations for the CSS content virtual modules
declare module 'virtual:global-css-content' {
  const content: string;
  export default content;
}

// Add declaration for the template styles CSS content
declare module 'virtual:template-vite-styles-css-content' {
  const content: string;
  export default content;
}

// Add declaration for contract schema content
declare module 'virtual:contract-schema-content' {
  const content: string;
  export default content;
}
