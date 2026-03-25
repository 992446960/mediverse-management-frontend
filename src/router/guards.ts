import type { Router, RouteLocationNormalized } from 'vue-router'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { i18n } from '@/i18n'
import { useAuthStore } from '@/stores/auth'
import { getSkipChangePassword } from '@/utils/auth'
import { hasAnyRole } from '@/utils/permission'
import type { UserRole } from '@/types/auth'

NProgress.configure({ showSpinner: false })

const whiteList = ['/login', '/401', '/403', '/404']

const appTitle = import.meta.env.VITE_APP_TITLE || 'Mediverse'

/** 路由 meta.title 存 i18n key，需翻译后再写入 document.title（浏览器标签） */
export function setDocumentTitle(to: RouteLocationNormalized) {
  const key = to.meta.title as string | undefined
  document.title = `${key ? `${i18n.global.t(key)} - ` : ''}${appTitle}`
}

export function createPermissionGuard(router: Router) {
  router.beforeEach(async (to) => {
    NProgress.start()
    const authStore = useAuthStore()

    setDocumentTitle(to)

    if (whiteList.includes(to.path)) {
      if (to.path === '/login' && authStore.isLoggedIn) {
        return '/'
      }
      return
    }

    if (!authStore.isLoggedIn) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }

    // 有持久化 user 时直接放行；无 user 时再拉取（兼容旧 session 或首次）
    if (!authStore.user) {
      try {
        await authStore.fetchUserInfo()
      } catch {
        authStore.clearAuthOnly()
        return { path: '/login', query: { redirect: to.fullPath } }
      }
    }

    if (
      authStore.user?.must_change_pwd &&
      to.path !== '/change-password' &&
      !getSkipChangePassword(authStore.user?.id)
    ) {
      return '/change-password'
    }

    // 按权限矩阵校验路由（所有环境统一，无开发环境 bypass）
    if (to.meta.requiredRoles) {
      const requiredRoles = to.meta.requiredRoles as UserRole[]
      const hasPermission = hasAnyRole(authStore.user, requiredRoles)
      if (!hasPermission) {
        return '/403'
      }
    }
  })

  router.afterEach(() => {
    NProgress.done()
  })
}
