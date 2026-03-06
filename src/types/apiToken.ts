export interface ApiToken {
  id: string
  name: string
  token_prefix: string // 只显示前几位
  permissions: string[]
  expires_at?: string
  last_used_at?: string
  is_active: boolean
  created_by: string
  created_at: string
}

export interface CreateApiTokenParams {
  name: string
  permissions: string[]
  expires_in_days?: number
}
