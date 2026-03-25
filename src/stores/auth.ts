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
import { normalizeAuthUser, mergeUserWithWorkbenchFlags } from '@/utils/authUser'

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
      // 后端可能把 has_expert_avatar 等放在 data 顶层，需合并后再标准化
      const payload = mergeUserWithWorkbenchFlags(res as Record<string, unknown>)
      user.value = normalizeAuthUser(payload)
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
        // 退出登录时清空标签页，防止切换账号后残留前一个用户的页签
        const { useTagsViewStore } = await import('@/stores/tagsView')
        useTagsViewStore().$reset()
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
        // 后端 /auth/me 返回 { user, has_expert_avatar, has_dept_avatar, has_org_avatar }，需合并后再标准化
        const payload = mergeUserWithWorkbenchFlags(res as Record<string, unknown>)
        user.value = normalizeAuthUser(payload)
      } catch (error) {
        clearAuthOnly()
        throw error
      }
    }

    /** 更新当前用户信息（如个人资料页 PUT 后写回，避免再请求 /auth/me） */
    function setUser(updated: User) {
      user.value = updated
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
      setUser,
    }
  },
  {
    persist: {
      key: AUTH_STORAGE_KEY,
      pick: ['user'],
    },
  }
)
