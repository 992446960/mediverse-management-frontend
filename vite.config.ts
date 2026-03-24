import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'
import { compression } from 'vite-plugin-compression2'
import { fileURLToPath, URL } from 'node:url'

const DEFAULT_DEV_PROXY_TARGET = 'https://mediverse-management.huaxisy.com'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devProxyTarget = env.DEV_PROXY_TARGET || DEFAULT_DEV_PROXY_TARGET

  return {
    plugins: [
      vue(),
      Components({
        resolvers: [
          AntDesignVueResolver({
            importStyle: false, // css in js
          }),
        ],
      }),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        dts: 'src/auto-imports.d.ts',
      }),
      compression({
        algorithms: ['gzip'],
        threshold: 10240,
        deleteOriginalAssets: false,
      }),
      compression({
        algorithms: ['brotliCompress'],
        threshold: 10240,
        deleteOriginalAssets: false,
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (
                id.includes('/vue/') ||
                id.includes('/vue-router/') ||
                id.includes('/pinia/') ||
                id.includes('/vue-i18n/')
              ) {
                return 'vue-vendor'
              }
              if (
                id.includes('/ant-design-vue/') ||
                id.includes('/@ant-design/') ||
                id.includes('/ant-design-x-vue/')
              ) {
                return 'antd'
              }
              if (id.includes('/@tiptap/')) {
                return 'tiptap'
              }
              if (id.includes('/@vue-office/')) {
                return 'vue-office'
              }
              return 'vendor'
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: devProxyTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
          timeout: 120000,
        },
      },
    },
  }
})
