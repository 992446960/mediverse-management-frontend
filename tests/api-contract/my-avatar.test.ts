/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * My Avatar 模块 — API 合规性测试
 *
 * 覆盖接口：
 *  GET  /my/avatar
 *  GET  /my/features
 *  GET  /my/avatar/stats
 *  GET  /my/avatar/knowledge/stats
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { loginAndGetToken, authedGet, unauthGet, type BaseResponse } from './setup'
import { assertMatchesSchema, assertBaseResponseOk } from './schema-validator'

describe('My Avatar 模块', () => {
  beforeAll(async () => {
    await loginAndGetToken()
  })

  // ─── GET /my/avatar ──────────────────────────────────────

  describe('GET /my/avatar', () => {
    it('应返回当前用户的 avatar 或 null', async () => {
      const res = await authedGet('/my/avatar')
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)

      const data = (res.data as any).data
      // data 可以是 AvatarDetailOut 或 null
      if (data !== null) {
        expect(typeof data.id).toBe('string')
        expect(typeof data.name).toBe('string')
        expect(Array.isArray(data.tags)).toBe(true)
      }

      await assertMatchesSchema('get_my_avatar_api_v1_my_avatar_get', res.data)
    })

    it('不带 Token 应返回 401', async () => {
      const res = await unauthGet('/my/avatar')
      expect(res.status).toBe(401)
    })
  })

  // ─── GET /my/features ────────────────────────────────────

  describe('GET /my/features', () => {
    it('应返回功能开关布尔值', async () => {
      const res = await authedGet('/my/features')
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)

      const data = (res.data as any).data
      const boolFields = [
        'digital_doctor',
        'knowledge_search',
        'dashboard',
        'my_workbench',
        'dept_workbench',
        'org_workbench',
        'has_avatar',
      ]
      for (const field of boolFields) {
        expect(typeof data[field]).toBe('boolean')
      }

      await assertMatchesSchema('get_my_features_api_v1_my_features_get', res.data)
    })
  })

  // ─── GET /my/avatar/stats ────────────────────────────────

  describe('GET /my/avatar/stats', () => {
    it('应返回统计数据', async () => {
      const res = await authedGet('/my/avatar/stats')
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)

      const data = (res.data as any).data
      expect(typeof data.total_sessions).toBe('number')
      expect(typeof data.today_sessions).toBe('number')
      expect(data.knowledge_progress).toBeDefined()
      expect(typeof data.knowledge_progress.percentage).toBe('number')

      await assertMatchesSchema('my_avatar_stats_api_v1_my_avatar_stats_get', res.data)
    })
  })

  // ─── GET /my/avatar/knowledge/stats ──────────────────────

  describe('GET /my/avatar/knowledge/stats', () => {
    it('缺少必填参数 owner_type/owner_id 应返回 400', async () => {
      const res = await authedGet('/my/avatar/knowledge/stats')
      expect(res.status).toBe(400)
    })
  })
})
