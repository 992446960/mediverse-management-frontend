import type { PaginationParams } from './api'

/** 列表/详情中的 API Token（无明文） */
export interface ApiToken {
  id: string
  org_id: string
  /** 机构名称（列表展示用，接口可选返回） */
  org_name?: string
  name: string
  description?: string | null
  /** 脱敏后的 token 展示，如 sk_live_xxxx */
  token_hash: string
  status: 'active' | 'inactive'
  last_used_at?: string | null
  created_by?: string | null
  created_at: string
}

/** 创建 Token 成功后的响应（含仅展示一次的明文） */
export interface ApiTokenCreateResult extends ApiToken {
  /** 明文 Token，仅创建时返回一次 */
  plain_token: string
}

export interface ApiTokenListParams extends PaginationParams {
  org_id?: string
  name?: string
  status?: 'active' | 'inactive'
}

export interface CreateApiTokenParams {
  org_id: string
  name: string
  description?: string
}

export interface UpdateApiTokenStatusParams {
  status: 'active' | 'inactive'
}
