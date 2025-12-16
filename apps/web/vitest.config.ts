import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

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
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ],
    },
    include: ['**/*.test.ts', '**/*.test.tsx'],
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
