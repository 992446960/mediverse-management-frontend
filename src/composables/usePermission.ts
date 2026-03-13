import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { hasRole, hasAnyRole } from '@/utils/permission'
import type { UserRole } from '@/types/auth'

export function usePermission() {
  const authStore = useAuthStore()

  const user = computed(() => authStore.user)

  // Basic Role Checks
  const isSysAdmin = computed(() => hasRole(user.value, 'sysadmin'))
  const isOrgAdmin = computed(() => hasRole(user.value, 'org_admin'))
  const isDeptAdmin = computed(() => hasRole(user.value, 'dept_admin'))
  const isUser = computed(() => hasRole(user.value, 'user'))

  // Capabilities
  const canManageOrg = computed(() => isSysAdmin.value)
  const canManageDept = computed(() => isSysAdmin.value || isOrgAdmin.value)
  const canManageUsers = computed(() => isSysAdmin.value || isOrgAdmin.value || isDeptAdmin.value)
  const canManageAvatars = computed(() => isSysAdmin.value || isOrgAdmin.value || isDeptAdmin.value)

  // Check specific roles helper
  function checkRoles(roles: UserRole[]) {
    return hasAnyRole(user.value, roles)
  }

  return {
    user,
    isSysAdmin,
    isOrgAdmin,
    isDeptAdmin,
    isUser,
    canManageOrg,
    canManageDept,
    canManageUsers,
    canManageAvatars,
    checkRoles,
  }
}
