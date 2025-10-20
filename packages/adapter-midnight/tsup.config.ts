import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: {
    compilerOptions: {
      composite: false,
      incremental: false,
    },
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  // External WASM packages to prevent bundling Node.js-specific code
  external: ['@midnight-ntwrk/zswap', '@midnight-ntwrk/onchain-runtime', '@midnight-ntwrk/ledger'],
});
