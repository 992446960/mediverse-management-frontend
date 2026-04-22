import type { PaginationParams } from './api'

export interface Organization {
  id: string
  name: string
  code: string | null
  description: string | null
  logo_url: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface OrganizationListParams extends PaginationParams {
  name?: string
  status?: 'active' | 'inactive'
}

export interface OrganizationForm {
  name: string
  code?: string
  description?: string
  logo_url?: string
  /** 更新机构状态（列表启停）时使用 */
  status?: 'active' | 'inactive'
}
