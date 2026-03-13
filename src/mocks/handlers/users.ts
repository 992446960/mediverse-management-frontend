import { http, HttpResponse } from 'msw'
import { users as initialUsers } from '../data/users'
import { organizations } from '../data/organizations'
import { departments } from '../data/departments'
import type { UserListItem, CreateUserPayload, UpdateUserPayload } from '@/types/user'
import type { UserRole } from '@/types/auth'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const mutableUsers: UserListItem[] = initialUsers.map((u) => ({ ...u }))

const orgMap = new Map(organizations.map((o) => [o.id, o]))
const deptMap = new Map(departments.map((d) => [d.id, d]))

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const userHandlers = [
  http.get(`${API_BASE}/users`, async ({ request }) => {
    await delay(250)
    const url = new URL(request.url)
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10))
    const pageSize = Math.min(
      100,
      Math.max(1, Number.parseInt(url.searchParams.get('page_size') || '20', 10))
    )
    const orgId = url.searchParams.get('org_id')?.trim() || ''
    const deptId = url.searchParams.get('dept_id')?.trim() || ''
    const keyword = url.searchParams.get('keyword')?.trim() || ''
    const role = url.searchParams.get('role') as UserRole | null
    const status = url.searchParams.get('status') as 'active' | 'inactive' | null

    let list = [...mutableUsers]
    if (orgId) list = list.filter((u) => u.org_id === orgId)
    if (deptId) list = list.filter((u) => u.dept_id === deptId)
    if (keyword) {
      const k = keyword.toLowerCase()
      list = list.filter(
        (u) => u.real_name.toLowerCase().includes(k) || u.username.toLowerCase().includes(k)
      )
    }
    if (role) list = list.filter((u) => u.roles.includes(role))
    if (status === 'active' || status === 'inactive') list = list.filter((u) => u.status === status)

    const total = list.length
    const start = (page - 1) * pageSize
    const items = list.slice(start, start + pageSize)

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { total, page, page_size: pageSize, items },
    })
  }),

  http.post(`${API_BASE}/users`, async ({ request }) => {
    await delay(250)
    const body = (await request.json()) as CreateUserPayload
    if (!body.username?.trim() || !body.real_name?.trim()) {
      return HttpResponse.json({
        code: 40001,
        message: '用户名、真实姓名为必填',
        data: null,
      })
    }
    if (!body.roles?.length || !body.roles.includes('user')) {
      return HttpResponse.json({
        code: 40001,
        message: '角色至少包含 user',
        data: null,
      })
    }
    const existing = mutableUsers.find((u) => u.username === body.username.trim())
    if (existing) {
      return HttpResponse.json({
        code: 40003,
        message: '用户名已存在',
        data: null,
      })
    }
    const orgId = body.org_id || ''
    const deptId = body.dept_id || ''
    const org = orgId ? orgMap.get(orgId) : undefined
    const dept = deptId ? deptMap.get(deptId) : undefined
    const id = `u_${Date.now()}`
    const now = new Date().toISOString()
    const newUser: UserListItem = {
      id,
      username: body.username.trim(),
      real_name: body.real_name.trim(),
      avatar_url: undefined,
      phone: undefined,
      email: undefined,
      org_id: orgId,
      org_name: org?.name ?? '',
      dept_id: deptId,
      dept_name: dept?.name ?? '',
      roles: [...body.roles],
      remark: body.remark?.trim(),
      status: body.status ?? 'active',
      created_at: now,
    }
    mutableUsers.push(newUser)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { ...newUser },
    })
  }),

  http.put(`${API_BASE}/users/:id`, async ({ request, params }) => {
    await delay(200)
    const id = params.id as string
    const body = (await request.json()) as UpdateUserPayload
    const idx = mutableUsers.findIndex((u) => u.id === id)
    if (idx === -1) {
      return HttpResponse.json({
        code: 40002,
        message: '用户不存在',
        data: null,
      })
    }
    const cur = mutableUsers[idx]!
    if (body.real_name !== undefined) cur.real_name = body.real_name.trim()
    if (body.org_id !== undefined) {
      cur.org_id = body.org_id
      const org = orgMap.get(body.org_id)
      cur.org_name = org?.name ?? ''
    }
    if (body.dept_id !== undefined) {
      cur.dept_id = body.dept_id
      const dept = deptMap.get(body.dept_id)
      cur.dept_name = dept?.name ?? ''
    }
    if (body.roles !== undefined) {
      if (!body.roles.length || !body.roles.includes('user')) {
        return HttpResponse.json({
          code: 40001,
          message: '角色至少包含 user',
          data: null,
        })
      }
      cur.roles = [...body.roles]
    }
    if (body.remark !== undefined) cur.remark = body.remark?.trim()
    if (body.status === 'active' || body.status === 'inactive') cur.status = body.status
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { ...cur },
    })
  }),

  http.post(`${API_BASE}/users/:id/reset-pass`, async ({ params }) => {
    await delay(200)
    const id = params.id as string
    const idx = mutableUsers.findIndex((u) => u.id === id)
    if (idx === -1) {
      return HttpResponse.json({
        code: 40002,
        message: '用户不存在',
        data: null,
      })
    }
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: null,
    })
  }),
]
