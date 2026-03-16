/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Avatars 模块 — API 合规性测试
 *
 * 覆盖接口：
 *  GET    /avatars
 *  POST   /avatars
 *  GET    /avatars/{id}
 *  PUT    /avatars/{id}
 *  DELETE /avatars/{id}
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

describe('Avatars 模块', () => {
  beforeAll(async () => {
    await loginAndGetToken()
  })

  // ─── GET /avatars ────────────────────────────────────────

  describe('GET /avatars', () => {
    it('应返回分页列表且符合 Schema', async () => {
      const res = await authedGet('/avatars', { page: 1, page_size: 10 })
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)

      const data = (res.data as any).data
      assertPaginatedData(data)

      if (data.items.length > 0) {
        const avatar = data.items[0]
        assertUUID(avatar.id, 'avatar.id')
        expect(typeof avatar.type).toBe('string')
        expect(typeof avatar.name).toBe('string')
        expect(Array.isArray(avatar.tags)).toBe(true)
        expect(typeof avatar.status).toBe('string')
        assertUUID(avatar.created_by, 'avatar.created_by')
        assertDatetime(avatar.created_at, 'avatar.created_at')
        assertDatetime(avatar.updated_at, 'avatar.updated_at')
      }

      await assertMatchesSchema('list_avatars_api_v1_avatars_get', res.data)
    })

    it('不带 Token 应返回 401', async () => {
      const res = await unauthGet('/avatars')
      expect(res.status).toBe(401)
    })

    it('支持 type 筛选', async () => {
      const res = await authedGet('/avatars', { type: 'expert' })
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)
    })

    it('支持 keyword 筛选', async () => {
      const res = await authedGet('/avatars', { keyword: '__nonexistent__' })
      expect(res.status).toBe(200)
      const data = (res.data as any).data
      expect(data.items).toBeInstanceOf(Array)
    })

    it('支持 status 筛选', async () => {
      const res = await authedGet('/avatars', { status: 'active' })
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)
    })

    it('分页边界: page=0 应返回 400', async () => {
      const res = await authedGet('/avatars', { page: 0 })
      expect(res.status).toBe(400)
    })

    it('分页边界: page_size=0 应返回 400', async () => {
      const res = await authedGet('/avatars', { page_size: 0 })
      expect(res.status).toBe(400)
    })

    it('分页边界: page_size=201 应返回 400', async () => {
      const res = await authedGet('/avatars', { page_size: 201 })
      expect(res.status).toBe(400)
    })
  })

  // ─── GET /avatars/{id} ──────────────────────────────────

  describe('GET /avatars/{id}', () => {
    it('查询已存在的 avatar 应返回详情且符合 Schema', async () => {
      // 先获取列表拿到一个真实 ID
      const listRes = await authedGet('/avatars', { page: 1, page_size: 1 })
      const items = (listRes.data as any).data?.items
      if (!items || items.length === 0) {
        console.warn('跳过: 列表为空，没有可测试的 avatar')
        return
      }

      const realId = items[0].id
      const res = await authedGet(`/avatars/${realId}`)
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)

      const detail = (res.data as any).data
      assertUUID(detail.id, 'detail.id')
      expect(typeof detail.name).toBe('string')
      expect(Array.isArray(detail.tags)).toBe(true)
      expect(Array.isArray(detail.knowledge_grants)).toBe(true)

      await assertMatchesSchema('get_avatar_detail_api_v1_avatars__id__get', res.data)
    })

    it('不存在的 ID 应返回业务错误或 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const res = await authedGet(`/avatars/${fakeId}`)
      const isError = res.status === 404 || (res.data as any)?.code !== 0
      expect(isError).toBe(true)
    })

    it('非 UUID 格式的 ID 应返回 400', async () => {
      const res = await authedGet('/avatars/not-a-uuid')
      expect(res.status).toBe(400)
    })
  })

  // ─── POST /avatars ──────────────────────────────────────

  describe('POST /avatars', () => {
    it('缺少必填字段应返回 400', async () => {
      const res = await authedPost('/avatars', {})
      expect(res.status).toBe(400)
    })

    it('只传 type 缺 name 应返回 400', async () => {
      const res = await authedPost('/avatars', { type: 'expert' })
      expect(res.status).toBe(400)
    })
  })

  // ─── PUT /avatars/{id} ──────────────────────────────────

  describe('PUT /avatars/{id}', () => {
    it('不存在的 ID 应返回业务错误或 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const res = await authedPut(`/avatars/${fakeId}`, { name: 'test-update' })
      const isError = res.status === 404 || (res.data as any)?.code !== 0
      expect(isError).toBe(true)
    })
  })

  // ─── DELETE /avatars/{id} ───────────────────────────────

  describe('DELETE /avatars/{id}', () => {
    it('不存在的 ID 应返回业务错误或 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const res = await authedDelete(`/avatars/${fakeId}`)
      const isError = res.status === 404 || (res.data as any)?.code !== 0
      expect(isError).toBe(true)
    })
  })
})
