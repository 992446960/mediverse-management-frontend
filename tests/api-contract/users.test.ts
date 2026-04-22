/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Users 模块 — API 合规性测试
 *
 * 覆盖接口：
 *  GET  /users
 *  POST /users
 *  PUT  /users/{id}
 *  POST /users/{id}/reset-pass
 */
import { describe, it, expect, beforeAll } from 'vitest'
import {
  loginAndGetToken,
  authedGet,
  authedPost,
  authedPut,
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

describe('Users 模块', () => {
  beforeAll(async () => {
    await loginAndGetToken()
  })

  // ─── GET /users ──────────────────────────────────────────

  describe('GET /users', () => {
    it('应返回分页列表且符合 Schema', async () => {
      const res = await authedGet('/users', { page: 1, page_size: 10 })
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)

      const data = (res.data as any).data
      assertPaginatedData(data)

      if (data.items.length > 0) {
        const user = data.items[0]
        assertUUID(user.id, 'user.id')
        expect(typeof user.username).toBe('string')
        expect(typeof user.status).toBe('string')
        assertDatetime(user.created_at, 'user.created_at')
      }

      await assertMatchesSchema('list_users_api_v1_users_get', res.data)
    })

    it('不带 Token 应返回 401', async () => {
      const res = await unauthGet('/users')
      expect(res.status).toBe(401)
    })

    it('支持 keyword 筛选', async () => {
      const res = await authedGet('/users', { keyword: '__nonexistent__' })
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)
    })

    it('支持 role 筛选', async () => {
      const res = await authedGet('/users', { role: 'user' })
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)
    })

    it('分页边界: page_size 超出上限应返回 400', async () => {
      const res = await authedGet('/users', { page: 1, page_size: 201 })
      expect(res.status).toBe(400)
    })
  })

  // ─── POST /users ─────────────────────────────────────────

  describe('POST /users', () => {
    it('缺少必填字段应返回 400', async () => {
      const res = await authedPost('/users', {})
      expect(res.status).toBe(400)
    })
  })

  // ─── PUT /users/{id} ────────────────────────────────────

  describe('PUT /users/{id}', () => {
    it('不存在的 ID 应返回业务错误或 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const res = await authedPut(`/users/${fakeId}`, { real_name: 'test' })
      const isError = res.status === 404 || (res.data as any)?.code !== 0
      expect(isError).toBe(true)
    })
  })

  // ─── POST /users/{id}/reset-pass ────────────────────────

  describe('POST /users/{id}/reset-pass', () => {
    it('不存在的 ID 应返回业务错误或 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const res = await authedPost(`/users/${fakeId}/reset-pass`)
      const isError = res.status === 404 || (res.data as any)?.code !== 0
      expect(isError).toBe(true)
    })
  })
})
