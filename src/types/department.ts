import type { PaginationParams } from './api'

/** 科室（列表/详情，与 API 一致） */
export interface Department {
  id: string
  org_id: string
  org_name: string
  name: string
  code: string
  description?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

/** 科室列表查询参数 */
export interface DepartmentListParams extends PaginationParams {
  org_id?: string
  name?: string
  status?: 'active' | 'inactive'
}

/** 新增/编辑科室表单 */
export interface DepartmentForm {
  org_id: string
  name: string
  code?: string
  description?: string
  status?: 'active' | 'inactive'
}

/** 机构-科室树节点（API GET /departments/tree） */
export interface OrgDeptTreeNode {
  id: string
  name: string
  type: 'org' | 'dept'
  children?: OrgDeptTreeNode[]
}
