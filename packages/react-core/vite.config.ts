import path from 'path';
// import peerDepsExternal from 'rollup-plugin-peer-deps-external'; // Removed
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// To externalize peerDependencies

export default defineConfig({
  plugins: [
    // peerDepsExternal(), // Removed
    dts({
      insertTypesEntry: true,
      outDir: 'dist',
      tsconfigPath: './tsconfig.json',
    }),
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'OpenZeppelinTransactionFormReactCore', // UMD name if needed, can be more specific
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      // Ensure external packages (dependencies and peerDependencies) are not bundled
      external: [
        'react',
        'react-dom',
        '@openzeppelin/transaction-form-types',
        '@openzeppelin/transaction-form-utils',
        '@openzeppelin/transaction-form-ui', // This is a direct dep, but good to keep external if it's also a peer of others or to avoid duplication
        '@tanstack/react-query', // This is a peerDependency
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@tanstack/react-query': 'ReactQuery', // Added global for UMD if needed
        },
      },
    },
    sourcemap: true,
    target: 'esnext',
  },
});
