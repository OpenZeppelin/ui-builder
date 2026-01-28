import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/vite-config.ts'],
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
  // Bundle adapter-evm-core into the output - it's an internal workspace package
  noExternal: ['@openzeppelin/ui-builder-adapter-evm-core'],
});
