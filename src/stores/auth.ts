import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginParams, UserRole } from '@/types/auth'
import { authApi } from '@/api/auth'
import { getToken, setToken, setRefreshToken, clearAuth } from '@/utils/auth'
import { normalizeAuthUser } from '@/utils/authUser'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(getToken())

  const isLoggedIn = computed(() => !!token.value)
  const currentRoles = computed<UserRole[]>(() => (user.value ? [user.value.role] : []))
  const isSysAdmin = computed(() => currentRoles.value.includes('sysadmin'))
  const isOrgAdmin = computed(() => currentRoles.value.includes('org_admin'))
  const isDeptAdmin = computed(() => currentRoles.value.includes('dept_admin'))
  const currentOrgId = computed(() => user.value?.org_id || null)
  const currentDeptId = computed(() => user.value?.dept_id || null)

  async function login(params: LoginParams) {
    const res = await authApi.login(params)
    token.value = res.access_token
    setToken(res.access_token)
    setRefreshToken(res.refresh_token)
    user.value = normalizeAuthUser(res.user)
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout failed', error)
    } finally {
      token.value = null
      user.value = null
      clearAuth()
    }
  }

  /** 仅清空本地登录态，不请求 logout 接口（用于 fetchUserInfo 失败时避免二次 500） */
  function clearAuthOnly() {
    token.value = null
    user.value = null
    clearAuth()
  }

  async function fetchUserInfo() {
    try {
      const res = await authApi.getUserInfo()
      user.value = normalizeAuthUser(res)
    } catch (error) {
      clearAuthOnly()
      throw error
    }
  }

  return {
    user,
    token,
    isLoggedIn,
    currentRoles,
    isSysAdmin,
    isOrgAdmin,
    isDeptAdmin,
    currentOrgId,
    currentDeptId,
    login,
    logout,
    clearAuthOnly,
    fetchUserInfo,
  }
})
