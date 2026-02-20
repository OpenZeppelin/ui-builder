import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

import { logger } from '@openzeppelin/ui-utils';

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
 *    Entries prefixed with `npm:` are resolved via Node's module resolution from the
 *    builder package directory, so they work with any pnpm node-linker strategy.
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

// Define the virtual module IDs and their corresponding real file paths.
// Paths are relative to the monorepo root unless prefixed with `npm:`,
// which triggers Node module resolution from the builder package directory.
const VIRTUAL_MODULE_PREFIX = 'virtual:';
const RESOLVED_VIRTUAL_MODULE_PREFIX = '\0virtual:'; // Null byte prefix for resolved IDs
const NPM_RESOLVE_PREFIX = 'npm:';

const virtualFiles: Record<string, string> = {
  // Config files (relative to monorepo root)
  'tailwind-config-content': 'tailwind.config.cjs',
  'postcss-config-content': 'postcss.config.cjs',
  'components-json-content': 'components.json',
  // npm packages (resolved via Node module resolution — works with any pnpm hoisting strategy)
  'global-css-content': 'npm:@openzeppelin/ui-styles/global.css',
  // Template-specific CSS (relative to monorepo root)
  'template-vite-styles-css-content':
    'apps/builder/src/export/templates/typescript-react-vite/src/styles.css',
  // Core Type Files (relative to monorepo root)
  'contract-schema-content': 'packages/types/src/contracts/schema.ts',
};

/**
 * Vite plugin to load raw content from specified files into virtual modules.
 */
export function virtualContentLoaderPlugin(): Plugin {
  // Resolve the monorepo root directory relative to this plugin file
  // Assumes this file is in apps/builder/vite-plugins/
  const monorepoRoot = path.resolve(__dirname, '../../..');
  const builderDir = path.join(monorepoRoot, 'apps/builder');
  const builderRequire = createRequire(path.join(builderDir, 'package.json'));

  return {
    name: 'virtual-content-loader',

    resolveId(id) {
      if (id.startsWith(VIRTUAL_MODULE_PREFIX)) {
        const moduleName = id.substring(VIRTUAL_MODULE_PREFIX.length);
        if (virtualFiles[moduleName]) {
          return RESOLVED_VIRTUAL_MODULE_PREFIX + moduleName;
        }
      }
      return null;
    },

    load(id) {
      if (id.startsWith(RESOLVED_VIRTUAL_MODULE_PREFIX)) {
        const moduleName = id.substring(RESOLVED_VIRTUAL_MODULE_PREFIX.length);
        const fileName = virtualFiles[moduleName];

        if (fileName) {
          try {
            let filePath: string;
            if (fileName.startsWith(NPM_RESOLVE_PREFIX)) {
              // Use Node module resolution from the builder package so this works
              // with any pnpm node-linker strategy (hoisted or isolated).
              const specifier = fileName.substring(NPM_RESOLVE_PREFIX.length);
              filePath = builderRequire.resolve(specifier);
            } else {
              filePath = path.resolve(monorepoRoot, fileName);
            }

            const content = fs.readFileSync(filePath, 'utf-8');

            if (fileName.endsWith('.css')) {
              const escapedContent = content
                .replace(/\\/g, '\\')
                .replace(/`/g, '\\`')
                .replace(/\$/g, '\\$');
              return `export default \`${escapedContent}\`;`;
            } else {
              return `export default ${JSON.stringify(content)};`;
            }
          } catch (error: unknown) {
            let message = 'Unknown error';
            if (error instanceof Error) {
              message = error.message;
            }
            logger.error('virtual-content-loader', `Error loading ${fileName}:`, message);
            return `export default "";`;
          }
        }
      }
      return null;
    },
  };
}
