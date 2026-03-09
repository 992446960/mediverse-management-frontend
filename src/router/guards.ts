import type { Router } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { hasAnyRole } from '@/utils/permission'
import type { UserRole } from '@/types/auth'

const whiteList = ['/login', '/403', '/404']

export function createPermissionGuard(router: Router) {
  router.beforeEach(async (to) => {
    const authStore = useAuthStore()

    document.title = `${to.meta.title ? to.meta.title + ' - ' : ''}${import.meta.env.VITE_APP_TITLE || 'Mediverse'}`

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

    if (authStore.user?.must_change_pwd && to.path !== '/change-password') {
      return '/change-password'
    }

    if (to.meta.requiredRoles) {
      const requiredRoles = to.meta.requiredRoles as UserRole[]
      const hasPermission = hasAnyRole(authStore.user, requiredRoles)
      if (!hasPermission) {
        return '/403'
      }
    }
  })
}
