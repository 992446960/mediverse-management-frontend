import { request } from '@/api/index'
import type { PaginatedData } from '@/types/api'
import type {
  Avatar,
  AvatarDetail,
  AvatarListParams,
  CreateAvatarParams,
  UpdateAvatarParams,
} from '@/types/avatar'

/** 分页查询分身列表（支持 type / org_id / dept_id / user_id / keyword 筛选） */
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
/** 查询分身详情（含 knowledge_grants 等） */
export function getAvatarDetail(id: string) {
  return request.get<AvatarDetail>(`/avatars/${id}`)
}

export interface ChatAvatarQuota {
  avatar_scope: string
  max_sessions: number
  used_sessions: number
  remaining: number
  is_unlimited: boolean
  is_exhausted: boolean
}

export interface ChatAvatar extends Pick<
  Avatar,
  'id' | 'type' | 'name' | 'avatar_url' | 'bio' | 'tags' | 'org_name' | 'dept_name'
> {
  quota?: ChatAvatarQuota
}

export interface ChatAvatarListParams {
  keyword?: string
  type?: Avatar['type']
  org_id?: string
  dept_id?: string
  page?: number
  page_size?: number
}

/** 查询当前用户可体验的分身列表（/chat/avatars） */
export function getChatAvatars(params: ChatAvatarListParams) {
  return request.get<{ total: number; page: number; page_size: number; items: ChatAvatar[] }>(
    '/chat/avatars',
    { params }
  )
}
