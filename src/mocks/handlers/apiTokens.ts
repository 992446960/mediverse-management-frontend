import { http, HttpResponse } from 'msw'
import { apiTokens as initialTokens } from '../data/apiTokens'
import { organizations } from '../data/organizations'
import type {
  ApiToken,
  ApiTokenCreateResult,
  CreateApiTokenParams,
  UpdateApiTokenParams,
} from '@/types/apiTokens'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const mutableTokens: ApiToken[] = initialTokens.map((t) => ({ ...t }))

function resolveOrgName(orgId: string): string {
  return organizations.find((o) => o.id === orgId)?.name ?? ''
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 生成模拟明文 token（仅创建时返回一次，使用 med_ 前缀避免被密钥扫描误判） */
function generatePlainToken(): string {
  const prefix = 'med_'
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let rest = ''
  for (let i = 0; i < 32; i++) rest += chars[Math.floor(Math.random() * chars.length)]
  return prefix + rest
}

export const apiTokenHandlers = [
  http.get(`${API_BASE}/admin/api-tokens`, async ({ request }) => {
    await delay(250)
    const url = new URL(request.url)
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10))
    const pageSize = Math.min(
      200,
      Math.max(1, Number.parseInt(url.searchParams.get('page_size') || '20', 10))
    )
    const name = url.searchParams.get('name')?.trim() || ''
    const org_id = url.searchParams.get('org_id')?.trim() || ''
    const status = url.searchParams.get('status') as 'active' | 'inactive' | null

    let list = mutableTokens

    if (name) {
      list = list.filter((t) => t.name.includes(name))
    }
    if (org_id) {
      list = list.filter((t) => t.org_id === org_id)
    }
    if (status === 'active' || status === 'inactive') {
      list = list.filter((t) => t.status === status)
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

  http.post(`${API_BASE}/admin/api-tokens`, async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as CreateApiTokenParams
    if (!body.name?.trim()) {
      return HttpResponse.json({
        code: 40001,
        message: 'Token 名称不能为空',
        data: null,
      })
    }
    if (!body.org_id) {
      return HttpResponse.json({
        code: 40001,
        message: '请选择所属机构',
        data: null,
      })
    }

    const id = `token_${Date.now()}`
    const now = new Date().toISOString()
    const plain_token = generatePlainToken()
    const token_hash = `${plain_token.slice(0, 10)}${'x'.repeat(22)}`
    const org_name = resolveOrgName(body.org_id)

    const newToken: ApiToken = {
      id,
      org_id: body.org_id,
      org_name,
      name: body.name.trim(),
      description: body.description?.trim() ?? null,
      token_hash,
      status: 'active',
      last_used_at: null,
      created_by: 'mock_user',
      created_at: now,
    }
    mutableTokens.push(newToken)

    const createResult: ApiTokenCreateResult = {
      ...newToken,
      plain_token,
    }
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: createResult,
    })
  }),

  http.put(`${API_BASE}/admin/api-tokens/:id`, async ({ request, params }) => {
    await delay(200)
    const id = params.id as string
    const body = (await request.json()) as UpdateApiTokenParams
    const idx = mutableTokens.findIndex((t) => t.id === id)
    if (idx === -1) {
      return HttpResponse.json({
        code: 40002,
        message: 'Token 不存在',
        data: null,
      })
    }
    const cur = mutableTokens[idx]!
    if (body.name !== undefined) cur.name = body.name.trim()
    if (body.description !== undefined) cur.description = body.description?.trim() ?? null
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { ...cur },
    })
  }),

  http.patch(`${API_BASE}/admin/api-tokens/:id/status`, async ({ request, params }) => {
    await delay(200)
    const id = params.id as string
    const body = (await request.json()) as { status: 'active' | 'inactive' }
    const idx = mutableTokens.findIndex((t) => t.id === id)
    if (idx === -1) {
      return HttpResponse.json({
        code: 40002,
        message: 'Token 不存在',
        data: null,
      })
    }
    mutableTokens[idx]!.status = body.status
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { ...mutableTokens[idx] },
    })
  }),

  http.delete(`${API_BASE}/admin/api-tokens/:id`, async ({ params }) => {
    await delay(200)
    const id = params.id as string
    const idx = mutableTokens.findIndex((t) => t.id === id)
    if (idx === -1) {
      return HttpResponse.json({
        code: 40002,
        message: 'Token 不存在',
        data: null,
      })
    }
    mutableTokens.splice(idx, 1)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: null,
    })
  }),
]
