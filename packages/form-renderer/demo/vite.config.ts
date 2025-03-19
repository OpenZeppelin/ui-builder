import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    open: true,
  },
  resolve: {
    alias: {
      '@src': resolve(__dirname, '../src'),
    },
  },
});
