import { copyFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-data-json',
      closeBundle() {
        const src = resolve('data.json');
        const dest = resolve('dist/data.json');
        if (existsSync(src)) copyFileSync(src, dest);
      },
    },
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.worktrees/**'],
  },
});
