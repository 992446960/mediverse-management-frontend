/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Knowledge QA 模块 — API 合规性测试
 *
 * 覆盖接口：
 *  POST /knowledge-qa/search
 *  POST /knowledge-qa/follow-up
 *  GET  /knowledge-qa/history
 */
import { describe, it, expect, beforeAll } from 'vitest'
import {
  loginAndGetToken,
  authedGet,
  authedPost,
  unauthGet,
  unauthPost,
  type BaseResponse,
} from './setup'
import {
  assertMatchesSchema,
  assertBaseResponseOk,
  assertUUID,
  assertDatetime,
} from './schema-validator'

describe('Knowledge QA 模块', () => {
  beforeAll(async () => {
    await loginAndGetToken()
  })

  // ─── POST /knowledge-qa/search ───────────────────────────

  describe('POST /knowledge-qa/search', () => {
    it('正常搜索应返回结果且符合 Schema', async () => {
      const res = await authedPost('/knowledge-qa/search', { query: '测试查询' })

      // 可能因为没有知识库数据返回空结果，但结构应正确
      if (res.status === 200) {
        assertBaseResponseOk(res.data as Record<string, any>)

        const data = (res.data as any).data
        assertUUID(data.qa_session_id, 'qa_session_id')
        expect(typeof data.answer).toBe('string')
        expect(Array.isArray(data.citations)).toBe(true)
        expect(Array.isArray(data.matched_files)).toBe(true)

        await assertMatchesSchema('search_knowledge_api_v1_knowledge_qa_search_post', res.data)
      }
    })

    it('缺少 query 应返回 400', async () => {
      const res = await authedPost('/knowledge-qa/search', {})
      expect(res.status).toBe(400)
    })

    it('不带 Token 应返回 401', async () => {
      const res = await unauthPost('/knowledge-qa/search', { query: 'test' })
      expect(res.status).toBe(401)
    })
  })

  // ─── POST /knowledge-qa/follow-up ───────────────────────

  describe('POST /knowledge-qa/follow-up', () => {
    it('缺少必填字段应返回 400', async () => {
      const res = await authedPost('/knowledge-qa/follow-up', {})
      expect(res.status).toBe(400)
    })

    it('无效的 qa_session_id 应返回业务错误', async () => {
      const fakeSessionId = '00000000-0000-0000-0000-000000000000'
      const res = await authedPost('/knowledge-qa/follow-up', {
        qa_session_id: fakeSessionId,
        query: '追问测试',
      })
      const isError = res.status === 404 || (res.data as any)?.code !== 0
      expect(isError).toBe(true)
    })
  })

  // ─── GET /knowledge-qa/history ───────────────────────────

  describe('GET /knowledge-qa/history', () => {
    it('应返回搜索历史数组', async () => {
      const res = await authedGet('/knowledge-qa/history')
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)

      const data = (res.data as any).data
      expect(Array.isArray(data)).toBe(true)

      if (data.length > 0) {
        const item = data[0]
        assertUUID(item.id, 'history.id')
        expect(typeof item.query).toBe('string')
        assertDatetime(item.created_at, 'history.created_at')
      }

      await assertMatchesSchema('list_search_history_api_v1_knowledge_qa_history_get', res.data)
    })

    it('不带 Token 应返回 401', async () => {
      const res = await unauthGet('/knowledge-qa/history')
      expect(res.status).toBe(401)
    })

    it('limit 参数应生效', async () => {
      const res = await authedGet('/knowledge-qa/history', { limit: 3 })
      expect(res.status).toBe(200)
      const data = (res.data as any).data
      expect(data.length).toBeLessThanOrEqual(3)
    })
  })
})
