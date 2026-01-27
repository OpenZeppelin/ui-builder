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
  noExternal: ['@openzeppelin/ui-builder-adapter-evm-core'],
  external: ['react', 'react-dom', '@rainbow-me/rainbowkit'],
});
