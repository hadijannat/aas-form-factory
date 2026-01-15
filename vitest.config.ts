/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      all: true,
      include: ['src/lib/**/*.{ts,tsx}'],
      exclude: [
        '**/*.d.ts',
        '**/*.{test,spec}.{ts,tsx}',
        '**/__tests__/**',
        'src/lib/**/index.ts',
        'src/lib/api/**',
        'src/lib/catalog/**',
        'src/lib/schemas/**',
        'src/lib/exporters/aasx-exporter.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
        branches: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
