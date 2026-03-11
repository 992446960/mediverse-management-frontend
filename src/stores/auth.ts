import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginParams, UserRole } from '@/types/auth'
import { authApi } from '@/api/auth'
import {
  getToken,
  getRefreshToken,
  setToken,
  setRefreshToken,
  AUTH_STORAGE_KEY,
  clearAuth,
} from '@/utils/auth'
import { normalizeAuthUser } from '@/utils/authUser'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const user = ref<User | null>(null)
    const token = ref<string | null>(getToken())
    const refreshToken = ref<string | null>(getRefreshToken())

  const isLoggedIn = computed(() => !!token.value)
  const currentRoles = computed<UserRole[]>(() => (user.value ? [user.value.role] : []))
  const isSysAdmin = computed(() => currentRoles.value.includes('sysadmin'))
  const isOrgAdmin = computed(() => currentRoles.value.includes('org_admin'))
  const isDeptAdmin = computed(() => currentRoles.value.includes('dept_admin'))
  const currentOrgId = computed(() => user.value?.org_id || null)
  const currentDeptId = computed(() => user.value?.dept_id || null)
  /** 是否显示「我的工作台」 */
  const hasExpertAvatar = computed(() => user.value?.has_expert_avatar ?? false)
  /** 是否显示「科室工作台」 */
  const hasDeptAvatar = computed(() => user.value?.has_dept_avatar ?? false)
  /** 是否显示「机构工作台」 */
  const hasOrgAvatar = computed(() => user.value?.has_org_avatar ?? false)

  async function login(params: LoginParams) {
    const res = await authApi.login(params)
    token.value = res.access_token
    refreshToken.value = res.refresh_token
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
      refreshToken.value = null
      user.value = null
      clearAuth()
    }
  }

  /** 仅清空本地登录态，不请求 logout 接口（用于 fetchUserInfo 失败时避免二次 500） */
  function clearAuthOnly() {
    token.value = null
    refreshToken.value = null
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
    refreshToken,
    isLoggedIn,
    currentRoles,
    isSysAdmin,
    isOrgAdmin,
    isDeptAdmin,
    currentOrgId,
    currentDeptId,
    hasExpertAvatar,
    hasDeptAvatar,
    hasOrgAvatar,
    login,
    logout,
    clearAuthOnly,
    fetchUserInfo,
  }
  },
  {
    persist: {
      key: AUTH_STORAGE_KEY,
      pick: ['user'],
    },
  }
)
