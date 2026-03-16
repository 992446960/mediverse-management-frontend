/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * API Tokens 模块 — API 合规性测试
 *
 * 覆盖接口：
 *  GET    /admin/api-tokens
 *  POST   /admin/api-tokens
 *  PUT    /admin/api-tokens/{id}
 *  DELETE /admin/api-tokens/{id}
 *  PATCH  /admin/api-tokens/{id}/status
 */
import { describe, it, expect, beforeAll } from 'vitest'
import {
  loginAndGetToken,
  authedGet,
  authedPost,
  authedPut,
  authedPatch,
  authedDelete,
  unauthGet,
  type BaseResponse,
} from './setup'
import {
  assertMatchesSchema,
  assertBaseResponseOk,
  assertPaginatedData,
  assertUUID,
  assertDatetime,
} from './schema-validator'

describe('API Tokens 模块', () => {
  beforeAll(async () => {
    await loginAndGetToken()
  })

  // ─── GET /admin/api-tokens ───────────────────────────────

  describe('GET /admin/api-tokens', () => {
    it('应返回分页列表且符合 Schema', async () => {
      const res = await authedGet('/admin/api-tokens', { page: 1, page_size: 10 })
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)

      const data = (res.data as any).data
      assertPaginatedData(data)

      if (data.items.length > 0) {
        const token = data.items[0]
        assertUUID(token.id, 'token.id')
        expect(typeof token.name).toBe('string')
        expect(typeof token.status).toBe('string')
        assertDatetime(token.created_at, 'token.created_at')
      }

      await assertMatchesSchema('list_tokens_api_v1_admin_api_tokens_get', res.data)
    })

    it('不带 Token 应返回 401', async () => {
      const res = await unauthGet('/admin/api-tokens')
      expect(res.status).toBe(401)
    })
  })

  // ─── POST /admin/api-tokens ──────────────────────────────

  describe('POST /admin/api-tokens', () => {
    it('缺少必填字段应返回 400', async () => {
      const res = await authedPost('/admin/api-tokens', {})
      expect(res.status).toBe(400)
    })
  })

  // ─── PUT /admin/api-tokens/{id} ──────────────────────────

  describe('PUT /admin/api-tokens/{id}', () => {
    it('不存在的 ID 应返回业务错误或 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const res = await authedPut(`/admin/api-tokens/${fakeId}`, { name: 'test' })
      const isError = res.status === 404 || (res.data as any)?.code !== 0
      expect(isError).toBe(true)
    })
  })

  // ─── DELETE /admin/api-tokens/{id} ───────────────────────

  describe('DELETE /admin/api-tokens/{id}', () => {
    it('不存在的 ID 应返回业务错误或 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const res = await authedDelete(`/admin/api-tokens/${fakeId}`)
      const isError = res.status === 404 || (res.data as any)?.code !== 0
      expect(isError).toBe(true)
    })
  })

  // ─── PATCH /admin/api-tokens/{id}/status ─────────────────

  describe('PATCH /admin/api-tokens/{id}/status', () => {
    it('缺少 status 应返回 400', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const res = await authedPatch(`/admin/api-tokens/${fakeId}/status`, {})
      expect(res.status).toBe(400)
    })
  })
})
