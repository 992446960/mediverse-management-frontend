import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import { setupPermissionDirective } from './directives/permission'
import './styles/index.css'
import faviconUrl from '@/assets/logo.svg?url'

const faviconLink = document.createElement('link')
faviconLink.rel = 'icon'
faviconLink.type = 'image/svg+xml'
faviconLink.href = faviconUrl
document.head.appendChild(faviconLink)

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)
app.use(i18n)
setupPermissionDirective(app)

async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
    const { worker } = await import('./mocks/browser')
    await worker.start({ quiet: true })
    // 等待 Service Worker 接管后再挂载，避免刷新时 /auth/me 请求命中 Vite 代理导致 ECONNREFUSED
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

enableMocking().then(async () => {
  // 初始导航（含权限守卫重定向）完成后再挂载，避免首帧 route.matched 为空时先渲染 MainLayout 空壳
  await router.isReady()
  app.mount('#app')
  // 触发首次加载遮罩退场动画，动画结束后彻底移除 DOM 层
  document.body.classList.add('loaded')
  setTimeout(() => document.body.classList.add('loader-hidden'), 800)
})
