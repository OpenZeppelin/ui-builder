import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      exclude: ['src/stories/**', 'src/types/**', 'postcss.config.cjs', 'tailwind.config.cjs'],
      reporter: ['text', 'json', 'html'],
    },
  },
});
