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
  remark?: string
  status: 'active' | 'inactive'
  /** 是否显示「我的工作台」 */
  has_expert_avatar?: boolean
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

/** 新增用户请求体（与 API POST /users 一致，V2 不含 phone/email） */
export interface CreateUserPayload {
  username: string
  real_name: string
  password?: string
  org_id?: string
  dept_id?: string
  roles: UserRole[]
  remark?: string
  status?: 'active' | 'inactive'
}

/** 新增用户响应：返回创建后的完整用户对象（同列表项） */
export type CreateUserResponse = UserListItem

/** 编辑用户请求体（与 API PUT /users/:id 一致，字段可选） */
export interface UpdateUserPayload {
  real_name?: string
  avatar_url?: string
  org_id?: string
  dept_id?: string
  roles?: UserRole[]
  remark?: string
  status?: 'active' | 'inactive'
}

/** 重置密码：POST /users/:id/reset-pass 无 body，响应 data 为 null */
