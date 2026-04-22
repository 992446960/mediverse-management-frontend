import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const envDir = fileURLToPath(new URL('.', import.meta.url))
  const env = loadEnv(mode, envDir, ['API_', 'TEST_'])

  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    test: {
      include: ['tests/api-contract/**/*.test.ts'],
      testTimeout: 30_000,
      hookTimeout: 30_000,
      isolate: false,
      env: {
        API_BASE_URL: env.API_BASE_URL || 'https://mediverse-management.huaxisy.com/api/v1',
        TEST_USERNAME: env.TEST_USERNAME || 'string',
        TEST_PASSWORD: env.TEST_PASSWORD || 'string',
      },
    },
  }
})
