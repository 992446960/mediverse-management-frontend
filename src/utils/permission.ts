import type { User } from '@/types/auth'
import type { UserRole } from '@/types/auth'

/**
 * 判断用户是否拥有指定角色
 */
export function hasRole(user: User | null | undefined, role: UserRole): boolean {
  if (!user?.role) return false
  return user.role === role
}

/**
 * 判断用户是否拥有给定角色列表中的任意一个
 */
export function hasAnyRole(user: User | null | undefined, roles: UserRole[]): boolean {
  if (!user?.role || !Array.isArray(roles) || roles.length === 0) return false
  return roles.includes(user.role)
}
