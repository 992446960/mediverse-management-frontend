import { http, HttpResponse } from 'msw'
import { avatars as initialAvatars } from '../data/avatars'
import { organizations } from '../data/organizations'
import { departments } from '../data/departments'
import { users } from '../data/users'
import type { Avatar, CreateAvatarParams, UpdateAvatarParams } from '@/types/avatar'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const mutableAvatars: Avatar[] = initialAvatars.map((a) => ({ ...a }))

function resolveOrgName(orgId: string): string {
  return organizations.find((o) => o.id === orgId)?.name ?? ''
}

function resolveDeptName(deptId: string): string {
  return departments.find((d) => d.id === deptId)?.name ?? ''
}

function resolveUserName(userId: string): string {
  return users.find((u) => u.id === userId)?.real_name ?? ''
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const avatarHandlers = [
  http.get(`${API_BASE}/avatars`, async ({ request }) => {
    await delay(250)
    const url = new URL(request.url)
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10))
    const pageSize = Math.min(
      100,
      Math.max(1, Number.parseInt(url.searchParams.get('page_size') || '20', 10))
    )
    const keyword = url.searchParams.get('keyword')?.trim() || ''
    const type = url.searchParams.get('type') as Avatar['type'] | null
    const org_id = url.searchParams.get('org_id')?.trim() || ''
    const dept_id = url.searchParams.get('dept_id')?.trim() || ''
    const status = url.searchParams.get('status') as 'active' | 'inactive' | null

    let list = mutableAvatars

    if (keyword) {
      list = list.filter((a) => a.name.includes(keyword))
    }
    if (type === 'general' || type === 'specialist' || type === 'expert') {
      list = list.filter((a) => a.type === type)
    }
    if (org_id) {
      list = list.filter((a) => a.org_id === org_id)
    }
    if (dept_id) {
      list = list.filter((a) => a.dept_id === dept_id)
    }
    if (status === 'active' || status === 'inactive') {
      list = list.filter((a) => a.status === status)
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

  http.post(`${API_BASE}/avatars`, async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as CreateAvatarParams
    if (!body.name?.trim()) {
      return HttpResponse.json({
        code: 40001,
        message: '分身名称不能为空',
        data: null,
      })
    }
    if (!body.type) {
      return HttpResponse.json({
        code: 40001,
        message: '请选择分身类型',
        data: null,
      })
    }
    if (body.type === 'general' && !body.org_id) {
      return HttpResponse.json({
        code: 40001,
        message: '全科分身请选择机构',
        data: null,
      })
    }
    if (body.type === 'specialist' && (!body.org_id || !body.dept_id)) {
      return HttpResponse.json({
        code: 40001,
        message: '专科分身请选择机构与科室',
        data: null,
      })
    }
    if (body.type === 'expert' && (!body.org_id || !body.dept_id || !body.user_id)) {
      return HttpResponse.json({
        code: 40001,
        message: '专家分身请选择机构、科室与用户',
        data: null,
      })
    }

    const id = `avatar_${body.type}_${Date.now()}`
    const now = new Date().toISOString()
    const newAvatar: Avatar = {
      id,
      type: body.type,
      org_id: body.org_id ?? '',
      org_name: body.org_id ? resolveOrgName(body.org_id) : '',
      dept_id: body.dept_id ?? null,
      dept_name: body.dept_id ? resolveDeptName(body.dept_id) : null,
      user_id: body.user_id ?? null,
      user_name: body.user_id ? resolveUserName(body.user_id) : null,
      name: body.name.trim(),
      avatar_url: body.avatar_url?.trim() ?? null,
      bio: body.bio?.trim() ?? null,
      tags: body.tags ?? [],
      greeting: body.greeting?.trim() ?? null,
      style: body.style ?? 'formal',
      status: 'active',
      created_by: 'mock_user',
      created_at: now,
      updated_at: now,
    }
    mutableAvatars.push(newAvatar)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: newAvatar,
    })
  }),

  http.put(`${API_BASE}/avatars/:id`, async ({ request, params }) => {
    await delay(200)
    const id = params.id as string
    const body = (await request.json()) as UpdateAvatarParams
    const idx = mutableAvatars.findIndex((a) => a.id === id)
    if (idx === -1) {
      return HttpResponse.json({
        code: 40002,
        message: '分身不存在',
        data: null,
      })
    }
    const cur = mutableAvatars[idx]!
    if (body.name !== undefined) cur.name = body.name.trim()
    if (body.avatar_url !== undefined)
      cur.avatar_url = body.avatar_url ? body.avatar_url.trim() : null
    if (body.bio !== undefined) cur.bio = body.bio ? body.bio.trim() : null
    if (body.tags !== undefined) cur.tags = body.tags
    if (body.greeting !== undefined) cur.greeting = body.greeting ? body.greeting.trim() : null
    if (body.style !== undefined) cur.style = body.style
    if (body.style_custom !== undefined)
      cur.style_custom = body.style_custom ? body.style_custom.trim() : null
    if (body.status !== undefined) cur.status = body.status
    cur.updated_at = new Date().toISOString()
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { ...cur },
    })
  }),

  http.delete(`${API_BASE}/avatars/:id`, async ({ params }) => {
    await delay(200)
    const id = params.id as string
    const idx = mutableAvatars.findIndex((a) => a.id === id)
    if (idx === -1) {
      return HttpResponse.json({
        code: 40002,
        message: '分身不存在',
        data: null,
      })
    }
    mutableAvatars.splice(idx, 1)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: null,
    })
  }),

  http.get(`${API_BASE}/avatars/:id`, async ({ params }) => {
    await delay(150)
    const id = params.id as string
    const avatar = mutableAvatars.find((a) => a.id === id)
    if (!avatar) {
      return HttpResponse.json({
        code: 40002,
        message: '分身不存在',
        data: null,
      })
    }
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { ...avatar },
    })
  }),

  http.post(`${API_BASE}/upload/avatar`, async ({ request }) => {
    await delay(300)
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file || !(file instanceof File)) {
      return HttpResponse.json({
        code: 40001,
        message: '请选择要上传的文件',
        data: null,
      })
    }
    // 转为 data URL，保证上传成功后能正确回显
    const buf = await file.arrayBuffer()
    const bytes = new Uint8Array(buf)
    const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('')
    const base64 = btoa(binary)
    const url = `data:${file.type || 'image/jpeg'};base64,${base64}`
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: {
        url,
        file_name: file.name,
        file_size: file.size,
      },
    })
  }),
]
