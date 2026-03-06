import { request } from '@/api/index'
import type { PaginatedData } from '@/types/api'
import type { Avatar, AvatarListParams, CreateAvatarParams, UpdateAvatarParams } from '@/types/avatar'

/** 分页查询分身列表（支持 type / org_id / dept_id / keyword 筛选） */
export function getAvatars(params: AvatarListParams) {
  return request.get<PaginatedData<Avatar>>('/avatars', { params })
}

/** 创建分身 */
export function createAvatar(data: CreateAvatarParams) {
  return request.post<Avatar>('/avatars', data)
}

/** 更新分身 */
export function updateAvatar(id: string, data: UpdateAvatarParams) {
  return request.put<Avatar>(`/avatars/${id}`, data)
}

/** 删除分身 */
export function deleteAvatar(id: string) {
  return request.delete<null>(`/avatars/${id}`)
}

/** 启用/停用分身 */
export function updateAvatarStatus(id: string, data: { status: 'active' | 'inactive' }) {
  return request.patch<Avatar>(`/avatars/${id}/status`, data)
}

/** 查询分身详情（含 knowledge_grants 等） */
export function getAvatarDetail(id: string) {
  return request.get<Avatar>(`/avatars/${id}`)
}
