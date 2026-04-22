import { request } from '@/api/index'
import type { PaginatedData } from '@/types/api'
import type { Organization, OrganizationListParams, OrganizationForm } from '@/types/organization'

export function getOrganizations(params: OrganizationListParams) {
  return request.get<PaginatedData<Organization>>('/organizations', { params })
}

export function createOrganization(data: OrganizationForm) {
  return request.post<Organization>('/organizations', data)
}

export function updateOrganization(id: string, data: Partial<OrganizationForm>) {
  return request.put<Organization>(`/organizations/${id}`, data)
}

export function deleteOrganization(id: string) {
  return request.delete<null>(`/organizations/${id}`)
}
