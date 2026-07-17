/**
 * ViteConfigGenerator
 *
 * Generates vite.config.ts files for exported applications with adapter-specific
 * configuration. Uses the adapter's config to conditionally include special build requirements.
 */

import type { AdapterConfig, Ecosystem } from '@openzeppelin/ui-types';

export interface ViteConfigGeneratorOptions {
  ecosystem: Ecosystem;
  adapterConfig?: AdapterConfig;
}

/**
 * Generates a vite.config.ts file tailored to the exported application's ecosystem
 *
 * @param options - Configuration options including the target ecosystem and adapter config
 * @returns The complete vite.config.ts file content as a string
 */
export function generateViteConfig(options: ViteConfigGeneratorOptions): string {
  const { adapterConfig } = options;
  const viteConfig = adapterConfig?.viteConfig;

  // Build imports section
  const imports = [
    "import { createRequire } from 'node:module';",
    "import path from 'path';",
    "import tailwindcss from '@tailwindcss/vite';",
    "import react from '@vitejs/plugin-react';",
    "import { defineConfig } from 'vite';",
  ];

  if (viteConfig?.imports) {
    imports.push(...viteConfig.imports);
  }

  // Build config initialization
  const configInit: string[] = [
    '  const require = createRequire(import.meta.url);',
    '  // eventemitter3@5 ESM wrapper default-imports CJS; alias + pre-bundle for Vite interop.',
    '  let eventemitter3CjsEntry: string | undefined;',
    '  try {',
    "    eventemitter3CjsEntry = require.resolve('eventemitter3');",
    '  } catch {',
    '    try {',
    "      eventemitter3CjsEntry = createRequire(require.resolve('@wagmi/core/package.json')).resolve(",
    "        'eventemitter3'",
    '      );',
    '    } catch {',
    '      eventemitter3CjsEntry = undefined;',
    '    }',
    '  }',
    '',
  ];
  if (viteConfig?.configInit) {
    configInit.push(
      '  // Import adapter Vite configuration',
      '  // Required for adapter-specific build requirements (WASM, module deduplication, etc.)',
      `  ${viteConfig.configInit}`,
      ''
    );
  }

  // Build plugins array
  const plugins: string[] = [];
  if (viteConfig?.plugins) {
    plugins.push(`    ${viteConfig.plugins}`);
  }
  plugins.push('    react(),', '    tailwindcss(),');

  // Build resolve.dedupe config
  const dedupeConfig = viteConfig?.dedupe ? `    ${viteConfig.dedupe}` : '';

  // Always pre-bundle eventemitter3 + debug (wallet CJS interop). Merge adapter includes.
  const optimizeDepsInclude = buildOptimizeDepsInclude(viteConfig?.optimizeDeps?.include);
  const optimizeDepsExclude = viteConfig?.optimizeDeps?.exclude
    ? `    ${viteConfig.optimizeDeps.exclude}`
    : '';

  return `${imports.join('\n')}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
${configInit.join('\n')}  return {
    plugins: [
${plugins.join('\n')}
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // Node.js polyfills for browser compatibility
        buffer: 'buffer/',
        events: 'events/',
        ...(eventemitter3CjsEntry ? { eventemitter3: eventemitter3CjsEntry } : {}),
      },
${dedupeConfig}
    },
    define: {
      'process.env': {},
      // Some transitive dependencies referenced by wallet stacks expect Node's \`global\` in the browser.
      // In particular, chains of imports like randombytes -> @near-js/crypto -> @hot-wallet/sdk
      // can throw "ReferenceError: global is not defined" during runtime without this alias.
      // Mapping \`global\` to \`globalThis\` provides a safe browser shim for exported apps.
      global: 'globalThis',
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
${optimizeDepsInclude}
${optimizeDepsExclude}
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      minify: 'esbuild',
      esbuild: mode === 'development' ? {} : { drop: ['console', 'debugger'] },
    },
    server: {
      port: 3000,
      open: true,
    },
  };
});
`;
}

/**
 * Builds an `include: [...]` block that always lists eventemitter3 + debug, then
 * appends any adapter-provided include entries (string fragment from ViteConfigInfo).
 */
function buildOptimizeDepsInclude(adapterInclude?: string): string {
  const always = ["'eventemitter3'", "'debug'"];

  if (!adapterInclude) {
    return `      include: [${always.join(', ')}],`;
  }

  const raw = adapterInclude.trim();
  // Expected shape: `include: [ ... ]` (possibly multiline)
  if (raw.startsWith('include:')) {
    const listStart = raw.indexOf('[');
    const listEnd = raw.lastIndexOf(']');
    if (listStart >= 0 && listEnd > listStart) {
      const inner = raw.slice(listStart + 1, listEnd).trim();
      if (!inner) {
        return `      include: [${always.join(', ')}],`;
      }
      return `      include: [\n        ${always.join(',\n        ')},\n        ${inner}\n      ],`;
    }
  }

  // Fallback: keep adapter snippet and prepend a second include is not valid — wrap defaults only
  return `      include: [${always.join(', ')}],\n    ${raw}`;
}
