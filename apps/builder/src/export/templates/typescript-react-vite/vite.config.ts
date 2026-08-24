import { createRequire } from 'node:module';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// eventemitter3@5 ships an ESM wrapper that default-imports its CJS build. Vite
// can serve that without interop, so wallet deps fail with
// "does not provide an export named 'default'". Alias to the CJS entry +
// pre-bundle so Vite synthesizes a proper default export.
//
// `debug` is intentionally NOT aliased or pre-bundled: forcing its resolved entry
// bypasses the package browser field (role-manager / ui-builder builder pattern).
// Transitive wallet deps are hoisted via export .npmrc public-hoist-pattern.
const require = createRequire(import.meta.url);
function resolveEventEmitter3CjsEntry(): string | undefined {
  try {
    return require.resolve('eventemitter3');
  } catch {
    try {
      const viaWagmiCore = createRequire(require.resolve('@wagmi/core/package.json'));
      return viaWagmiCore.resolve('eventemitter3');
    } catch {
      return undefined;
    }
  }
}
const eventemitter3CjsEntry = resolveEventEmitter3CjsEntry();

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      ...(eventemitter3CjsEntry ? { eventemitter3: eventemitter3CjsEntry } : {}),
      // WalletConnect support was removed and .pnpmfile.cjs strips its provider
      // from the install tree. @wagmi/connectors still ships an unreachable
      // walletConnect module that dynamically imports it, and Rollup resolves
      // dynamic imports at build time even when unreachable, so point it at a
      // stub. See src/shims/walletconnect-removed.ts.
      '@walletconnect/ethereum-provider': path.resolve(
        __dirname,
        './src/shims/walletconnect-removed.ts'
      ),
      // The MetaMask SDK is stripped from the install tree for licence reasons
      // (proprietary, Non-Commercial Use only). @wagmi/connectors still ships an
      // unreachable metaMask module that dynamically imports it, so point it at a
      // stub. See src/shims/metamask-removed.ts.
      '@metamask/sdk': path.resolve(__dirname, './src/shims/metamask-removed.ts'),
    },
  },
  define: {
    'process.env': {},
    // Some transitive dependencies referenced by wallet stacks expect Node's `global` in the browser.
    // In particular, chains of imports like randombytes -> @near-js/crypto -> @hot-wallet/sdk
    // can throw "ReferenceError: global is not defined" during runtime without this alias.
    // Mapping `global` to `globalThis` provides a safe browser shim for exported apps.
    global: 'globalThis',
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
    include: ['eventemitter3'],
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
}));
