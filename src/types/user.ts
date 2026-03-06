import type { PaginationParams } from './api'
import type { UserRole } from './auth'

/** 用户列表项（与 API GET /users 一致） */
export interface UserListItem {
  id: string
  username: string
  real_name: string
  avatar_url?: string
  phone?: string
  email?: string
  org_id: string
  org_name: string
  dept_id: string
  dept_name: string
  roles: UserRole[]
  status: 'active' | 'inactive'
  has_avatar: boolean
  created_at: string
}

/** 用户列表查询参数（与 API 一致） */
export interface UserListParams extends PaginationParams {
  org_id?: string
  dept_id?: string
  keyword?: string
  role?: UserRole
  status?: 'active' | 'inactive'
}

/** 新增用户请求体（与 API POST /users 一致） */
export interface CreateUserPayload {
  username: string
  real_name: string
  org_id: string
  dept_id: string
  phone?: string
  email?: string
  roles: UserRole[]
}

/** 新增用户响应（含仅返回一次的初始密码） */
export interface CreateUserResponse extends Omit<UserListItem, 'has_avatar'> {
  initial_password?: string
  must_change_pwd: boolean
}

/** 编辑用户请求体（与 API PUT /users/:id 一致，字段可选） */
export interface UpdateUserPayload {
  real_name?: string
  dept_id?: string
  phone?: string
  email?: string
}

/** 设置用户角色请求体（与 API PATCH /users/:id/roles 一致） */
export interface UpdateUserRolesPayload {
  roles: UserRole[]
}

/** 重置密码响应（临时密码仅返回一次） */
export interface ResetPasswordResponse {
  new_password: string
  must_change_pwd: boolean
}
