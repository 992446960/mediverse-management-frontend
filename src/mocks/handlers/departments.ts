import { http, HttpResponse } from 'msw'
import { organizations } from '../data/organizations'
import { departments as initialDepts } from '../data/departments'
import type { Department, DepartmentForm, OrgDeptTreeNode } from '@/types/department'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const mutableDepts: Department[] = initialDepts.map(d => ({ ...d }))

const orgMap = new Map(organizations.map(o => [o.id, o]))

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function buildTree(): OrgDeptTreeNode[] {
  return organizations
    .filter(org => org.status === 'active')
    .map(org => {
      const children = mutableDepts
        .filter(d => d.org_id === org.id)
        .map(d => ({ id: d.id, name: d.name, type: 'dept' as const }))
      return {
        id: org.id,
        name: org.name,
        type: 'org' as const,
        children: children.length ? children : undefined,
      }
    })
}

export const departmentHandlers = [
  http.get(`${API_BASE}/departments`, async ({ request }) => {
    await delay(200)
    const url = new URL(request.url)
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10))
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('page_size') || '20', 10)))
    const orgId = url.searchParams.get('org_id')?.trim() || ''
    const name = url.searchParams.get('name')?.trim() || ''
    const status = url.searchParams.get('status') as 'active' | 'inactive' | null

    let list = mutableDepts

    if (orgId) list = list.filter(d => d.org_id === orgId)
    if (name) list = list.filter(d => d.name.includes(name))
    if (status === 'active' || status === 'inactive') list = list.filter(d => d.status === status)

    const total = list.length
    const start = (page - 1) * pageSize
    const items = list.slice(start, start + pageSize)

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { total, page, page_size: pageSize, items },
    })
  }),

  http.get(`${API_BASE}/departments/tree`, async () => {
    await delay(200)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: buildTree(),
    })
  }),

  http.post(`${API_BASE}/departments`, async ({ request }) => {
    await delay(200)
    const body = (await request.json()) as DepartmentForm
    if (!body.org_id?.trim() || !body.name?.trim()) {
      return HttpResponse.json({
        code: 40001,
        message: '所属机构和科室名称不能为空',
        data: null,
      })
    }
    const org = orgMap.get(body.org_id)
    const id = `dept_${Date.now()}`
    const now = new Date().toISOString()
    const newDept: Department = {
      id,
      org_id: body.org_id,
      org_name: org?.name ?? '',
      name: body.name.trim(),
      code: body.code?.trim() ?? '',
      description: body.description?.trim() ?? '',
      status: 'active',
      created_at: now,
      updated_at: now,
    }
    mutableDepts.push(newDept)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: newDept,
    })
  }),

  http.put(`${API_BASE}/departments/:id`, async ({ request, params }) => {
    await delay(200)
    const id = params.id as string
    const body = (await request.json()) as Partial<DepartmentForm>
    const idx = mutableDepts.findIndex(d => d.id === id)
    if (idx === -1) {
      return HttpResponse.json({
        code: 40002,
        message: '科室不存在',
        data: null,
      })
    }
    const cur = mutableDepts[idx]!
    if (body.name !== undefined) cur.name = body.name.trim()
    if (body.code !== undefined) cur.code = body.code?.trim() ?? ''
    if (body.description !== undefined) cur.description = body.description?.trim() ?? ''
    cur.updated_at = new Date().toISOString()
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { ...cur },
    })
  }),

  http.delete(`${API_BASE}/departments/:id`, async ({ params }) => {
    await delay(200)
    const id = params.id as string
    const idx = mutableDepts.findIndex(d => d.id === id)
    if (idx === -1) {
      return HttpResponse.json({
        code: 40002,
        message: '科室不存在',
        data: null,
      })
    }
    mutableDepts.splice(idx, 1)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: null,
    })
  }),

  http.patch(`${API_BASE}/departments/:id/status`, async ({ request, params }) => {
    await delay(200)
    const id = params.id as string
    const body = (await request.json()) as { status: 'active' | 'inactive' }
    const idx = mutableDepts.findIndex(d => d.id === id)
    if (idx === -1) {
      return HttpResponse.json({
        code: 40002,
        message: '科室不存在',
        data: null,
      })
    }
    const cur = mutableDepts[idx]!
    cur.status = body.status
    cur.updated_at = new Date().toISOString()
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { ...cur },
    })
  }),
]
