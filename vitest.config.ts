import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup/vitest.setup.ts'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'vite.config.ts',
        'vitest.config.ts'
      ],

      // Global thresholds
      thresholds: {
        lines: 80,
        functions: 75,
        branches: 75,
        statements: 80
      },

      // Include all files in coverage report
      include: [
        'services/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
        'utils/**/*.{ts,tsx}',
        'contexts/**/*.{ts,tsx}'
      ]
    },

    // Test execution
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,

    // Parallel execution for speed
    pool: 'threads'
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
});
