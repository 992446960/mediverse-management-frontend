import { http, HttpResponse } from 'msw'
import { organizations as initialOrgs } from '../data/organizations'
import type { Organization, OrganizationForm } from '@/types/organization'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const mutableOrgs: Organization[] = initialOrgs.map(o => ({ ...o }))

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const organizationHandlers = [
  http.get(`${API_BASE}/organizations`, async ({ request }) => {
    await delay(200)
    const url = new URL(request.url)
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10))
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('page_size') || '20', 10)))
    const name = url.searchParams.get('name')?.trim() || ''
    const status = url.searchParams.get('status') as 'active' | 'inactive' | null

    let list = mutableOrgs

    if (name) {
      list = list.filter(o => o.name.includes(name))
    }
    if (status === 'active' || status === 'inactive') {
      list = list.filter(o => o.status === status)
    }

    const total = list.length
    const start = (page - 1) * pageSize
    const items = list.slice(start, start + pageSize)

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: {
        total,
        page,
        page_size: pageSize,
        items,
      },
    })
  }),

  http.post(`${API_BASE}/organizations`, async ({ request }) => {
    await delay(200)
    const body = (await request.json()) as OrganizationForm
    if (!body.name?.trim()) {
      return HttpResponse.json({
        code: 40001,
        message: '机构名称不能为空',
        data: null,
      })
    }
    const id = `org_${Date.now()}`
    const now = new Date().toISOString()
    const newOrg: Organization = {
      id,
      name: body.name.trim(),
      code: body.code?.trim() || null,
      description: body.description?.trim() || null,
      logo_url: body.logo_url?.trim() || null,
      status: 'active',
      created_at: now,
      updated_at: now,
    }
    mutableOrgs.push(newOrg)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: newOrg,
    })
  }),

  http.put(`${API_BASE}/organizations/:id`, async ({ request, params }) => {
    await delay(200)
    const id = params.id as string
    const body = (await request.json()) as Partial<OrganizationForm>
    const idx = mutableOrgs.findIndex(o => o.id === id)
    if (idx === -1) {
      return HttpResponse.json({
        code: 404,
        message: '机构不存在',
        data: null,
      })
    }
    const cur = mutableOrgs[idx]!
    if (body.name !== undefined) cur.name = body.name.trim()
    if (body.code !== undefined) cur.code = body.code?.trim() || null
    if (body.description !== undefined) cur.description = body.description?.trim() || null
    if (body.logo_url !== undefined) cur.logo_url = body.logo_url?.trim() || null
    cur.updated_at = new Date().toISOString()
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { ...cur },
    })
  }),

  http.delete(`${API_BASE}/organizations/:id`, async ({ params }) => {
    await delay(200)
    const id = params.id as string
    const idx = mutableOrgs.findIndex(o => o.id === id)
    if (idx === -1) {
      return HttpResponse.json({
        code: 404,
        message: '机构不存在',
        data: null,
      })
    }
    mutableOrgs.splice(idx, 1)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: null,
    })
  }),

  http.patch(`${API_BASE}/organizations/:id/status`, async ({ request, params }) => {
    await delay(200)
    const id = params.id as string
    const body = (await request.json()) as { status: 'active' | 'inactive' }
    const idx = mutableOrgs.findIndex(o => o.id === id)
    if (idx === -1) {
      return HttpResponse.json({
        code: 404,
        message: '机构不存在',
        data: null,
      })
    }
    const cur = mutableOrgs[idx]!
    cur.status = body.status
    cur.updated_at = new Date().toISOString()
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { ...cur },
    })
  }),
]
