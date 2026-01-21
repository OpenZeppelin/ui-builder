import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
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
