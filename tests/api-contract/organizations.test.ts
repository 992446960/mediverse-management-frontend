/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Organizations 模块 — API 合规性测试
 *
 * 覆盖接口：
 *  GET    /organizations
 *  POST   /organizations
 *  PUT    /organizations/{id}
 *  DELETE /organizations/{id}
 */
import { describe, it, expect, beforeAll } from 'vitest'
import {
  loginAndGetToken,
  authedGet,
  authedPost,
  authedPut,
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

describe('Organizations 模块', () => {
  beforeAll(async () => {
    await loginAndGetToken()
  })

  // ─── GET /organizations ──────────────────────────────────

  describe('GET /organizations', () => {
    it('应返回分页列表且符合 Schema', async () => {
      const res = await authedGet('/organizations', { page: 1, page_size: 10 })
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)

      const data = (res.data as any).data
      assertPaginatedData(data)

      if (data.items.length > 0) {
        const item = data.items[0]
        assertUUID(item.id, 'org.id')
        expect(typeof item.name).toBe('string')
        expect(typeof item.code).toBe('string')
        assertDatetime(item.created_at, 'org.created_at')
      }

      await assertMatchesSchema('list_organizations_api_v1_organizations_get', res.data)
    })

    it('不带 Token 应返回 401', async () => {
      const res = await unauthGet('/organizations')
      expect(res.status).toBe(401)
    })

    it('支持 name 筛选', async () => {
      const res = await authedGet('/organizations', { name: '__nonexistent__' })
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)
      expect((res.data as any).data.items).toBeInstanceOf(Array)
    })
  })

  // ─── POST /organizations ─────────────────────────────────

  describe('POST /organizations', () => {
    it('缺少必填字段应返回 400', async () => {
      const res = await authedPost('/organizations', {})
      expect(res.status).toBe(400)
    })
  })

  // ─── PUT /organizations/{id} ─────────────────────────────

  describe('PUT /organizations/{id}', () => {
    it('不存在的 ID 应返回业务错误或 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const res = await authedPut(`/organizations/${fakeId}`, { name: 'test' })
      const isError = res.status === 404 || (res.data as any)?.code !== 0
      expect(isError).toBe(true)
    })
  })

  // ─── DELETE /organizations/{id} ──────────────────────────

  describe('DELETE /organizations/{id}', () => {
    it('不存在的 ID 应返回业务错误或 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const res = await authedDelete(`/organizations/${fakeId}`)
      const isError = res.status === 404 || (res.data as any)?.code !== 0
      expect(isError).toBe(true)
    })
  })
})
