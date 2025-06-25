import path from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    // @ts-expect-error - incompatible types between vite-plugin-dts and vite
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
      external: [
        'react',
        'react-dom',
        '@openzeppelin/transaction-form-types',
        '@openzeppelin/transaction-form-utils',
        '@radix-ui/react-accordion',
        '@radix-ui/react-checkbox',
        '@radix-ui/react-dialog',
        '@radix-ui/react-label',
        '@radix-ui/react-progress',
        '@radix-ui/react-radio-group',
        '@radix-ui/react-select',
        '@radix-ui/react-slot',
        '@radix-ui/react-tabs',
        '@radix-ui/react-toast',
        '@radix-ui/react-tooltip',
        '@web3icons/react',
        'class-variance-authority',
        'clsx',
        'lodash',
        'lucide-react',
        'tailwind-merge',
        'tailwindcss-animate',
      ],
    },
    sourcemap: true,
    // Reduce bloat from legacy browsers
    target: 'esnext',
    // Minify option is true by default
  },
});
