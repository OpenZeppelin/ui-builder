import path from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'dist',
      tsconfigPath: './tsconfig.json',
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      // Ensure external packages are not bundled
      external: ['@openzeppelin/transaction-form-types'],
    },
    sourcemap: true,
    // Reduce bloat from legacy browsers
    target: 'esnext',
    // Minify option is true by default
  },
});
