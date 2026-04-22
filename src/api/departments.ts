import { request } from '@/api/index'
import type { PaginatedData } from '@/types/api'
import type {
  Department,
  DepartmentListParams,
  DepartmentForm,
  OrgDeptTreeNode,
} from '@/types/department'

export function getDepartments(params: DepartmentListParams) {
  return request.get<PaginatedData<Department>>('/departments', { params })
}

/** 机构-科室树（当前用户权限范围内） */
export function getDepartmentsTree() {
  return request.get<OrgDeptTreeNode[]>('/departments/tree')
}

export function createDepartment(data: DepartmentForm) {
  return request.post<Department>('/departments', data)
}

export function updateDepartment(id: string, data: Partial<Omit<DepartmentForm, 'org_id'>>) {
  return request.put<Department>(`/departments/${id}`, data)
}

export function deleteDepartment(id: string) {
  return request.delete<null>(`/departments/${id}`)
}
