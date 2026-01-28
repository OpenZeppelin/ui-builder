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
  // Mark peer dependencies as external to avoid bundling duplicate instances.
  // These must use the consumer's versions to avoid React context mismatches.
  external: [
    'react',
    'react-dom',
    '@rainbow-me/rainbowkit',
    '@openzeppelin/ui-components',
    '@openzeppelin/ui-react',
    'lucide-react',
  ],
});
