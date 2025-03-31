import type { Plugin } from 'vite';

import fs from 'fs';
import path from 'path';

/**
 * @module virtual-content-loader
 *
 * @description
 * This Vite plugin provides a mechanism to load the raw text content of specific
 * files (like config files from the monorepo root or CSS files from other packages)
 * into virtual modules.
 *
 * Why?
 * Vite's standard mechanisms (like `import.meta.glob` or `?raw` imports) can struggle
 * with resolving or reliably loading files outside the current package's root,
 * especially during development or testing (e.g., via Vitest).
 *
 * How it works:
 * 1. Define a mapping (`virtualFiles`) between a virtual module name (e.g., 'virtual:tailwind-config-content')
 *    and the real file path relative to the monorepo root.
 * 2. The `resolveId` hook intercepts imports matching the 'virtual:' prefix and marks them
 *    as resolved virtual modules using the null byte prefix ('\0').
 * 3. The `load` hook intercepts requests for these resolved virtual modules.
 * 4. It uses Node.js `fs.readFileSync` to synchronously read the actual file content.
 * 5. It returns the content as the default export of a JavaScript module string.
 *    - For CSS files, it uses an escaped template literal (`export default \`...\`;`).
 *    - For other files (.cjs, .json), it uses `JSON.stringify` (`export default "...";`).
 *
 * Usage:
 * - Add this plugin to `vite.config.ts` and relevant Vitest configs (`vitest.config.cli-export.ts`).
 * - Add corresponding type declarations for the virtual modules (e.g., in `src/types/virtual-modules.d.ts`).
 * - Import the content in your application code: `import myConfig from 'virtual:my-config-content';`
 */

// Define the virtual module IDs and their corresponding real file paths
// Paths are relative to the monorepo root
const VIRTUAL_MODULE_PREFIX = 'virtual:';
const RESOLVED_VIRTUAL_MODULE_PREFIX = '\0virtual:'; // Null byte prefix for resolved IDs

// Renamed map to reflect it handles more than just config
const virtualFiles: Record<string, string> = {
  // Config files
  'tailwind-config-content': 'tailwind.config.cjs',
  'postcss-config-content': 'postcss.config.cjs',
  'components-json-content': 'components.json',
  // CSS files
  'global-css-content': 'packages/styles/global.css',
  'data-slots-css-content': 'packages/styles/utils/auto-generated-data-slots.css',
  // Template-specific CSS (add template name if multiple templates have different styles.css)
  'template-vite-styles-css-content':
    'packages/core/src/export/templates/typescript-react-vite/src/styles.css',
};

/**
 * Vite plugin to load raw content from specified files into virtual modules.
 */
export function virtualContentLoaderPlugin(): Plugin {
  // Resolve the monorepo root directory relative to this plugin file
  // Assumes this file is in packages/core/vite-plugins/
  const monorepoRoot = path.resolve(__dirname, '../../..');

  return {
    name: 'virtual-content-loader', // Renamed plugin for clarity

    resolveId(id) {
      if (id.startsWith(VIRTUAL_MODULE_PREFIX)) {
        const moduleName = id.substring(VIRTUAL_MODULE_PREFIX.length);
        // Check the renamed map
        if (virtualFiles[moduleName]) {
          // Prepend null byte to mark as resolved virtual module
          return RESOLVED_VIRTUAL_MODULE_PREFIX + moduleName;
        }
      }
      return null; // Let other plugins handle it
    },

    load(id) {
      if (id.startsWith(RESOLVED_VIRTUAL_MODULE_PREFIX)) {
        const moduleName = id.substring(RESOLVED_VIRTUAL_MODULE_PREFIX.length);
        // Use the renamed map
        const fileName = virtualFiles[moduleName];

        if (fileName) {
          try {
            const filePath = path.resolve(monorepoRoot, fileName);
            const content = fs.readFileSync(filePath, 'utf-8');

            // Choose export format based on file type
            if (fileName.endsWith('.css')) {
              // Export CSS content as a raw JS string literal using backticks
              const escapedContent = content
                .replace(/\\/g, '\\') // Escape backslashes
                .replace(/`/g, '\\`') // Escape backticks
                .replace(/\$/g, '\\$'); // Escape dollars (for template literals)
              return `export default \`${escapedContent}\`;`;
            } else {
              // For non-CSS (like .cjs, .json), try JSON.stringify
              // This worked for postcss.config.cjs previously and might be safer for JS/JSON code
              return `export default ${JSON.stringify(content)};`;
            }
          } catch (error: unknown) {
            let message = 'Unknown error';
            if (error instanceof Error) {
              message = error.message;
            }
            console.error(`[virtual-content-loader] Error loading ${fileName}:`, message);
            return `export default ""; console.error("Failed to load ${fileName}: ${message}");`;
          }
        }
      }
      return null; // Let other plugins handle it
    },
  };
}
