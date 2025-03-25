/**
 * TYPE DECLARATIONS FOR VIRTUAL MODULES
 *
 * This file provides TypeScript type definitions for virtual modules used in the project.
 * Virtual modules are special modules that don't exist as real files on disk but are
 * created at runtime by Vite plugins.
 *
 * For detailed documentation on this approach, see:
 * packages/core/src/docs/cross-package-imports.md
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
 * This module declaration makes TypeScript aware of the 'virtual:form-renderer-config' import,
 * which is provided by the 'cross-package-modules-provider' plugin in vite.config.ts.
 *
 * WHY IT'S NEEDED:
 * Without this declaration, TypeScript would report an error about the module not being found,
 * even though Vite can resolve it at runtime through the plugin.
 *
 * THE UNDERLYING ISSUE:
 * In development mode, import.meta.glob cannot reliably resolve paths that cross package
 * boundaries in a monorepo. The virtual module is a workaround for this limitation.
 *
 * USED BY:
 * This module is imported by packages/core/src/export/PackageManager.ts to access
 * the form-renderer configuration for dependency management during form export.
 */
declare module 'virtual:form-renderer-config' {
  import type { FormRendererConfig } from '@form-renderer/types';
  export const formRendererConfig: FormRendererConfig;
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
// declare module 'virtual:templates-config' {
//   import type { TemplateConfig } from '@templates/types';
//   export const templateConfig: TemplateConfig;
// }

/**
 * ADDITIONAL TYPE EXPORTS
 *
 * This declaration supports any code that might import from the module path
 * '@form-renderer/types/FormRendererConfig'. It re-exports the types from the main
 * '@form-renderer/types' module, ensuring type compatibility.
 *
 * This is particularly important if there are any path transformations happening
 * in the Vite plugin that affect import paths.
 */
declare module '@form-renderer/types/FormRendererConfig' {
  // Re-export from the main type module
  export * from '@form-renderer/types';
}
