import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'
import { setupPermissionDirective } from './directives/permission'
import './styles/index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
setupPermissionDirective(app)

async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCK === 'true') {
    const { worker } = await import('./mocks/browser')
    await worker.start({ quiet: true })
    // 等待 Service Worker 接管后再挂载，避免刷新时 /auth/me 请求命中 Vite 代理导致 ECONNREFUSED
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

enableMocking().then(() => {
  app.mount('#app')
})
