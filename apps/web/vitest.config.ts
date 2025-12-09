import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import type { UserConfig } from 'vite';

// Use require for the React plugin
const react = require('@vitejs/plugin-react').default;

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8' as const,
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/tests/**',
        '**/types/**',
        '**/prisma/**',
        '**/.next/**',
        '**/coverage/**',
      ],
    },
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: resolve(__dirname, './'),
      },
    ],
  },
});
