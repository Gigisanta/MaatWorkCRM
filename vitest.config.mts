import { defineConfig } from 'vitest/config';

export default defineConfig({
  configFile: false,
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/**', '.next/**', '**/*.config.ts'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': '/Users/prueba/Desktop/maatworkcrmv3/src',
    },
  },
});
