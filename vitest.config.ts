import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['lib/__tests__/**/*.test.ts', '**/*.test.ts'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      include: ['lib/services/**', 'lib/validators/**'],
      reporter: ['text', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
