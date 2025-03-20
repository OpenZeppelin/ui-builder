import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    open: true,
  },
  resolve: {
    alias: {
      '@src': resolve(__dirname, '../src'),
      '@styles': resolve(__dirname, '../../styles'),
    },
  },
});
