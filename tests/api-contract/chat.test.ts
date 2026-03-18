/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Chat 模块 — API 合规性测试
 *
 * 覆盖接口：
 *  GET  /chat/avatars
 *  GET  /chat/sessions
 *  POST /chat/sessions
 *  PATCH /chat/sessions/{id}/title
 *  GET  /chat/sessions/{id}/messages
 *  POST /chat/sessions/{id}/messages
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { randomUUID } from 'node:crypto'
import {
  loginAndGetToken,
  authedGet,
  authedPost,
  authedPatch,
  unauthGet,
  authedPostFormDataStream,
  unauthPostFormDataStream,
  readSSEEvents,
  type BaseResponse,
} from './setup'
import {
  assertMatchesSchema,
  assertBaseResponseOk,
  assertUUID,
  assertDatetime,
} from './schema-validator'

describe('Chat 模块', () => {
  beforeAll(async () => {
    await loginAndGetToken()
  })

  // ─── GET /chat/avatars ───────────────────────────────────

  describe('GET /chat/avatars', () => {
    it('应返回可对话的 avatar 列表', async () => {
      const res = await authedGet('/chat/avatars')
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)

      const data = (res.data as any).data
      expect(data.items).toBeInstanceOf(Array)

      if (data.items.length > 0) {
        const avatar = data.items[0]
        assertUUID(avatar.id, 'chat_avatar.id')
        expect(typeof avatar.type).toBe('string')
        expect(typeof avatar.name).toBe('string')
        expect(Array.isArray(avatar.tags)).toBe(true)
        expect(avatar.quota).toBeDefined()
        expect(typeof avatar.quota.is_unlimited).toBe('boolean')
        expect(typeof avatar.quota.is_exhausted).toBe('boolean')
      }

      await assertMatchesSchema('list_chat_avatars_api_v1_chat_avatars_get', res.data)
    })

    it('不带 Token 应返回 401', async () => {
      const res = await unauthGet('/chat/avatars')
      expect(res.status).toBe(401)
    })
  })

  // ─── GET /chat/sessions ──────────────────────────────────

  describe('GET /chat/sessions', () => {
    it('应返回会话列表', async () => {
      const res = await authedGet('/chat/sessions', { page: 1, page_size: 10 })
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)

      const data = (res.data as any).data
      expect(data.items).toBeInstanceOf(Array)

      if (data.items.length > 0) {
        const session = data.items[0]
        assertUUID(session.id, 'session.id')
        assertUUID(session.avatar_id, 'session.avatar_id')
        expect(typeof session.status).toBe('string')
        assertDatetime(session.created_at, 'session.created_at')
      }

      await assertMatchesSchema('list_chat_sessions_api_v1_chat_sessions_get', res.data)
    })
  })

  // ─── POST /chat/sessions ─────────────────────────────────

  describe('POST /chat/sessions', () => {
    it('缺少必填字段应返回 400', async () => {
      const res = await authedPost('/chat/sessions', {})
      expect(res.status).toBe(400)
    })

    it('创建会话需要 avatar_id 和 idempotency_key', async () => {
      // 获取一个可用的 chat avatar
      const avatarsRes = await authedGet('/chat/avatars')
      const avatars = (avatarsRes.data as any).data?.items
      if (!avatars || avatars.length === 0) {
        console.warn('跳过: 没有可用的 chat avatar')
        return
      }

      const res = await authedPost('/chat/sessions', {
        avatar_id: avatars[0].id,
        idempotency_key: randomUUID(),
      })
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)

      const data = (res.data as any).data
      expect(data.session).toBeDefined()
      assertUUID(data.session.id, 'new_session.id')
      expect(data.quota).toBeDefined()

      await assertMatchesSchema('create_chat_session_api_v1_chat_sessions_post', res.data)
    })
  })

  // ─── PATCH /chat/sessions/{id}/title ─────────────────────

  describe('PATCH /chat/sessions/{id}/title', () => {
    it('缺少 title 应返回 400', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const res = await authedPatch(`/chat/sessions/${fakeId}/title`, {})
      expect(res.status).toBe(400)
    })
  })

  // ─── GET /chat/sessions/{id}/messages ────────────────────

  describe('GET /chat/sessions/{id}/messages', () => {
    it('不存在的 session 应返回业务错误或 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const res = await authedGet(`/chat/sessions/${fakeId}/messages`)
      const isError = res.status === 404 || (res.data as any)?.code !== 0
      expect(isError).toBe(true)
    })

    it('已有会话应返回消息列表且符合 Schema', async () => {
      // 获取一个已有会话
      const sessionsRes = await authedGet('/chat/sessions', { page: 1, page_size: 1 })
      const sessions = (sessionsRes.data as any).data?.items
      if (!sessions || sessions.length === 0) {
        console.warn('跳过: 没有已有会话')
        return
      }

      const sessionId = sessions[0].id
      const res = await authedGet(`/chat/sessions/${sessionId}/messages`)
      expect(res.status).toBe(200)
      assertBaseResponseOk(res.data as Record<string, any>)

      const data = (res.data as any).data
      expect(typeof data.has_more).toBe('boolean')
      expect(data.items).toBeInstanceOf(Array)

      if (data.items.length > 0) {
        const msg = data.items[0]
        assertUUID(msg.id, 'message.id')
        assertUUID(msg.session_id, 'message.session_id')
        expect(typeof msg.role).toBe('string')
        expect(Array.isArray(msg.parts)).toBe(true)
        assertDatetime(msg.created_at, 'message.created_at')
      }

      await assertMatchesSchema(
        'list_chat_messages_api_v1_chat_sessions__id__messages_get',
        res.data
      )
    })
  })

  // ─── POST /chat/sessions/{id}/messages ───────────────────

  describe('POST /chat/sessions/{id}/messages', () => {
    it('缺少 text 和 attachments 应返回 400', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const formData = new FormData()
      const res = await authedPostFormDataStream(`/chat/sessions/${fakeId}/messages`, formData)
      expect(res.status).toBe(400)
    })

    it('不带 Token 应返回 401', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const formData = new FormData()
      formData.append('text', 'hello')
      const res = await unauthPostFormDataStream(`/chat/sessions/${fakeId}/messages`, formData)
      expect(res.status).toBe(401)
    })

    it('已有会话发送 text 应返回 200 且 SSE 包含 delta 或 done', async () => {
      const sessionsRes = await authedGet('/chat/sessions', { page: 1, page_size: 1 })
      const sessions = (sessionsRes.data as any).data?.items
      if (!sessions || sessions.length === 0) {
        console.warn('跳过: 没有已有会话')
        return
      }

      const sessionId = sessions[0].id
      const formData = new FormData()
      formData.append('text', '接口测试消息')

      const res = await authedPostFormDataStream(`/chat/sessions/${sessionId}/messages`, formData)
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toMatch(/text\/event-stream/)
      expect(res.body).toBeTruthy()

      const events = await readSSEEvents(res.body!)
      const hasDeltaOrDone = events.some((e) => e.type === 'delta' || e.type === 'done')
      expect(hasDeltaOrDone).toBe(true)

      const doneEvent = events.find((e) => e.type === 'done')
      if (doneEvent) {
        expect(typeof doneEvent.message_id).toBe('string')
        expect(typeof doneEvent.tokens_used).toBe('number')
      }
    })
  })
})
