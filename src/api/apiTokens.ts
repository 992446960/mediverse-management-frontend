import { request } from '@/api/index'
import type { PaginatedData } from '@/types/api'
import type {
  ApiToken,
  ApiTokenCreateResult,
  ApiTokenListParams,
  CreateApiTokenParams,
  UpdateApiTokenParams,
  UpdateApiTokenStatusParams,
} from '@/types/apiTokens'

/** 分页查询 API Token 列表 */
export function getApiTokens(params: ApiTokenListParams) {
  return request.get<PaginatedData<ApiToken>>('/admin/api-tokens', { params })
}

/** 创建 API Token（返回含 plain_token，仅此一次） */
export function createApiToken(data: CreateApiTokenParams) {
  return request.post<ApiTokenCreateResult>('/admin/api-tokens', data)
}

/** 更新 API Token 信息（名称、描述） */
export function updateApiToken(id: string, data: UpdateApiTokenParams) {
  return request.put<ApiToken>(`/admin/api-tokens/${id}`, data)
}

/** 更新 API Token 状态 */
export function updateApiTokenStatus(id: string, data: UpdateApiTokenStatusParams) {
  return request.patch<ApiToken>(`/admin/api-tokens/${id}/status`, data)
}

/** 删除 API Token */
export function deleteApiToken(id: string) {
  return request.delete<null>(`/admin/api-tokens/${id}`)
}
