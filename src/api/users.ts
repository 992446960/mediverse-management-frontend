import { request } from '@/api/index'
import type { PaginatedData } from '@/types/api'
import type {
  UserListItem,
  UserListParams,
  CreateUserPayload,
  CreateUserResponse,
  UpdateUserPayload,
} from '@/types/user'

/** 分页查询用户列表（Query: org_id, dept_id, keyword, role, status, page, page_size） */
export function getUsers(params: UserListParams) {
  return request.get<PaginatedData<UserListItem>>('/users', { params })
}

/** 新增用户（password 可选，不传默认 123456；V2 不含 phone/email） */
export function createUser(data: CreateUserPayload) {
  return request.post<CreateUserResponse>('/users', data)
}

/** 编辑用户（含 roles；V2 可修改 real_name, org_id, dept_id, roles, remark, status） */
export function updateUser(id: string, data: UpdateUserPayload) {
  return request.put<UserListItem>(`/users/${id}`, data)
}

/** 重置密码：无 body，将密码重置为默认 123456，响应 data 为 null */
export function resetPass(id: string) {
  return request.post<null>(`/users/${id}/reset-pass`)
}
