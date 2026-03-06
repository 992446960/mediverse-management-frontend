import { request } from '@/api/index'
import type { PaginatedData } from '@/types/api'
import type {
  UserListItem,
  UserListParams,
  CreateUserPayload,
  CreateUserResponse,
  UpdateUserPayload,
  UpdateUserRolesPayload,
  ResetPasswordResponse,
} from '@/types/user'

/** 分页查询用户列表（支持 org_id / dept_id / keyword 过滤） */
export function getUsers(params: UserListParams) {
  return request.get<PaginatedData<UserListItem>>('/users', { params })
}

/** 新增用户（返回含 initial_password，仅创建时返回一次） */
export function createUser(data: CreateUserPayload) {
  return request.post<CreateUserResponse>('/users', data)
}

/** 编辑用户 */
export function updateUser(id: string, data: UpdateUserPayload) {
  return request.put<UserListItem>(`/users/${id}`, data)
}

/** 删除用户 */
export function deleteUser(id: string) {
  return request.delete<null>(`/users/${id}`)
}

/** 设置用户角色 */
export function updateUserRoles(id: string, data: UpdateUserRolesPayload) {
  return request.patch<UserListItem>(`/users/${id}/roles`, data)
}

/** 重置密码（返回临时密码，仅返回一次） */
export function resetPassword(id: string) {
  return request.post<ResetPasswordResponse>(`/users/${id}/reset-password`)
}
