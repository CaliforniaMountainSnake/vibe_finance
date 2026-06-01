import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/react/setup.ts'],
    include: ['tests/react/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(currentDirectory),
    },
  },
})
