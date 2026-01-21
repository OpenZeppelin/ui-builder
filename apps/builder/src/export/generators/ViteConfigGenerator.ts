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
    "import path from 'path';",
    "import tailwindcss from '@tailwindcss/vite';",
    "import react from '@vitejs/plugin-react';",
    "import { defineConfig } from 'vite';",
  ];

  if (viteConfig?.imports) {
    imports.push(...viteConfig.imports);
  }

  // Build config initialization
  const configInit: string[] = [];
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

  // Build optimizeDeps config
  const optimizeDepsInclude = viteConfig?.optimizeDeps?.include
    ? `    ${viteConfig.optimizeDeps.include}`
    : '';
  const optimizeDepsExclude = viteConfig?.optimizeDeps?.exclude
    ? `    ${viteConfig.optimizeDeps.exclude}`
    : '';

  const hasOptimizeDeps = optimizeDepsInclude || optimizeDepsExclude;

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
    },${
      hasOptimizeDeps
        ? `
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
${optimizeDepsInclude}
${optimizeDepsExclude}
    },`
        : ''
    }
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
