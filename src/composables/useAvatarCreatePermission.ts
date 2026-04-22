import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { AVATAR_WIZARD_TYPE_OPTIONS, type AvatarType } from '@/types/avatar'

/** 根据当前账号最高角色，返回可创建的分身类型选项 */
export function useAvatarCreatePermission() {
  const authStore = useAuthStore()

  /** 系统管理员：全科/专科/专家；机构管理员：专科/专家；科室管理员：仅专家 */
  const allowedTypeOptions = computed(() => {
    const role = authStore.user?.role
    if (role === 'sysadmin') {
      return AVATAR_WIZARD_TYPE_OPTIONS
    }
    if (role === 'org_admin') {
      return AVATAR_WIZARD_TYPE_OPTIONS.filter(
        (o) => o.value === 'specialist' || o.value === 'expert'
      )
    }
    if (role === 'dept_admin') {
      return AVATAR_WIZARD_TYPE_OPTIONS.filter((o) => o.value === 'expert')
    }
    return []
  })

  /** 当前角色下的默认类型（用于向导打开时初始化） */
  const defaultTypeForRole = computed<AvatarType>(() => {
    const first = allowedTypeOptions.value[0]
    return first?.value ?? 'general'
  })

  /** 判断指定类型是否对当前角色可用 */
  function isTypeAllowed(type: AvatarType): boolean {
    return allowedTypeOptions.value.some((o) => o.value === type)
  }

  return {
    allowedTypeOptions,
    defaultTypeForRole,
    isTypeAllowed,
  }
}
