import type { User, UserRole } from '@/types/auth'

const ROLE_PRIORITY: UserRole[] = ['sysadmin', 'org_admin', 'dept_admin', 'user']

/**
 * 从 roles 数组中取最高权限角色（用于菜单与权限判断）
 */
function pickPrimaryRole(roles: UserRole[] | undefined): UserRole {
  if (!Array.isArray(roles) || roles.length === 0) return 'user'
  for (const r of ROLE_PRIORITY) {
    if (roles.includes(r)) return r
  }
  return roles[0] as UserRole
}

/**
 * API 返回的用户可能是 User（role, full_name）或列表结构（roles, real_name）。
 * 统一标准化为 Auth 使用的 User 类型，保证菜单与权限判断使用 user.role 正确。
 */
export function normalizeAuthUser(raw: unknown): User {
  if (raw === null || typeof raw !== 'object') {
    throw new Error('Invalid user: expected object')
  }
  const o = raw as Record<string, unknown>
  const id = String(o.id ?? '')
  const username = String(o.username ?? '')
  const email = String(o.email ?? '')
  const full_name =
    typeof o.full_name === 'string'
      ? o.full_name
      : typeof o.real_name === 'string'
        ? o.real_name
        : username
  const role: UserRole =
    typeof o.role === 'string' && ROLE_PRIORITY.includes(o.role as UserRole)
      ? (o.role as UserRole)
      : pickPrimaryRole(o.roles as UserRole[] | undefined)
  const status = o.status as string | undefined
  const is_active = typeof o.is_active === 'boolean' ? o.is_active : status === 'active'
  const now = new Date().toISOString()
  const has_expert_avatar = o.has_expert_avatar === true
  const has_dept_avatar = o.has_dept_avatar === true
  const has_org_avatar = o.has_org_avatar === true
  return {
    id,
    username,
    email,
    full_name,
    avatar_url: typeof o.avatar_url === 'string' ? o.avatar_url : undefined,
    phone: typeof o.phone === 'string' ? o.phone : undefined,
    role,
    org_id: typeof o.org_id === 'string' ? o.org_id : undefined,
    dept_id: typeof o.dept_id === 'string' ? o.dept_id : undefined,
    is_active,
    must_change_pwd: o.must_change_pwd === true,
    has_avatar: o.has_avatar === true,
    has_expert_avatar,
    has_dept_avatar,
    has_org_avatar,
    last_login_at: typeof o.last_login_at === 'string' ? o.last_login_at : undefined,
    created_at: typeof o.created_at === 'string' ? o.created_at : now,
    updated_at: typeof o.updated_at === 'string' ? o.updated_at : now,
    remark: typeof o.remark === 'string' ? o.remark : undefined,
  }
}
