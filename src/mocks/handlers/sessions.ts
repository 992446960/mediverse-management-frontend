import { http, HttpResponse, delay } from 'msw'
import { mockSessions, mockMessages } from '../data/sessions'
import { mockAvatarSkills } from '../data/skills'
import { avatars as mockAvatars } from '../data/avatars'
import type { Session, Message } from '@/types/chat'

const BASE_URL = '/api/v1'

export const handlers = [
  // ── 3.1.2 查询会话列表 ─────────────────────────────────────────────
  http.get(`${BASE_URL}/chat/sessions`, async ({ request }) => {
    await delay(300)
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') || 1)
    const pageSize = Number(url.searchParams.get('page_size') || 20)

    const sorted = [...mockSessions].sort(
      (a, b) =>
        new Date(b.last_message_at || b.created_at).getTime() -
        new Date(a.last_message_at || a.created_at).getTime()
    )

    const start = (page - 1) * pageSize
    const items = sorted.slice(start, start + pageSize)

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: {
        total: mockSessions.length,
        page,
        page_size: pageSize,
        items,
      },
    })
  }),

  // ── 3.1.3 新建会话 ─────────────────────────────────────────────────
  http.post(`${BASE_URL}/chat/sessions`, async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as { avatar_id: string; idempotency_key?: string }

    const avatar = mockAvatars.find((a) => a.id === body.avatar_id)

    const newSession: Session = {
      id: `session_${Date.now()}`,
      title: null,
      avatar_id: body.avatar_id || 'avatar_default',
      avatar_name: avatar?.name ?? '数字医生',
      avatar_url: avatar?.avatar_url ?? '',
      status: 'active',
      created_at: new Date().toISOString(),
    }

    mockSessions.unshift(newSession)
    mockMessages[newSession.id] = []

    const greeting = avatar?.greeting ?? '您好，我是您的数字医生，请问有什么可以帮助您？'

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: {
        session: newSession,
        greeting,
        quota: {
          avatar_scope: 'custom',
          max_sessions: null,
          used_sessions: 1,
          remaining: null,
          is_unlimited: true,
          is_exhausted: false,
        },
      },
    })
  }),

  // ── 3.1.x 删除会话 ─────────────────────────────────────────────────
  http.delete(`${BASE_URL}/chat/sessions/:id`, async ({ params }) => {
    await delay(300)
    const { id } = params
    const index = mockSessions.findIndex((s) => s.id === id)
    if (index !== -1) {
      mockSessions.splice(index, 1)
      delete mockMessages[id as string]
    }

    return HttpResponse.json({ code: 0, message: 'ok', data: null })
  }),

  // ── 3.1.4 重命名会话 ────────────────────────────────────────────────
  http.patch(`${BASE_URL}/chat/sessions/:id/title`, async ({ params, request }) => {
    await delay(300)
    const { id } = params
    const body = (await request.json()) as { title: string }

    const session = mockSessions.find((s) => s.id === id)
    if (session) {
      session.title = body.title
    }

    return HttpResponse.json({ code: 0, message: 'ok', data: null })
  }),

  // ── 3.1.5 获取历史消息 ──────────────────────────────────────────────
  http.get(`${BASE_URL}/chat/sessions/:id/messages`, async ({ params, request }) => {
    await delay(300)
    const { id } = params
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get('limit') || 50)
    const beforeId = url.searchParams.get('before_id')

    let msgs: Message[] = mockMessages[id as string] || []
    if (beforeId) {
      const idx = msgs.findIndex((m) => m.id === beforeId)
      if (idx > 0) msgs = msgs.slice(0, idx)
    }
    const items = msgs.slice(-limit)
    const has_more = msgs.length > limit

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: { has_more, items },
    })
  }),

  // ── 3.1.6 发送消息（SSE 流式）──────────────────────────────────────
  http.post(`${BASE_URL}/chat/sessions/:id/messages`, async ({ params, request }) => {
    const { id } = params
    const sessionId = id as string
    const formData = await request.formData()
    const text = (formData.get('text') as string) || ''

    if (!mockMessages[sessionId]) mockMessages[sessionId] = []

    const assistantMsgId = `msg_${Date.now()}_a`
    let accumulatedText = ''

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const steps = [
          { title: '理解意图', description: '正在分析用户问题' },
          { title: '检索知识库', description: '正在搜索相关文档' },
          { title: '生成回答', description: '正在组织语言' },
        ]

        for (let i = 0; i < steps.length; i++) {
          const step = steps[i]!

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'thinking_step',
                index: i,
                title: step.title,
                status: 'processing',
              })}\n\n`
            )
          )
          await delay(400)

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'thinking_step',
                index: i,
                title: step.title,
                description: step.description,
                status: 'done',
                duration_ms: Math.floor(Math.random() * 300) + 100,
              })}\n\n`
            )
          )
          await delay(100)
        }

        const responseText = `这是针对"${text}"的模拟回答。\n\n这里是流式输出的内容演示：\n1. 第一点...\n2. 第二点...\n3. 总结...`

        for (const char of responseText) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'delta', content: char })}\n\n`)
          )
          accumulatedText += char
          await delay(30)
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'done',
              message_id: assistantMsgId,
              tokens_used: Math.floor(Math.random() * 500) + 100,
              tool_calls: [{ name: 'mock_tool', title: '模拟工具调用' }],
              search_references: [],
            })}\n\n`
          )
        )

        if (mockMessages[sessionId]) {
          mockMessages[sessionId].push({
            id: assistantMsgId,
            session_id: sessionId,
            role: 'assistant',
            parts: [{ type: 'text', text: accumulatedText }],
            thinking_process: steps.map((s) => ({
              title: s.title,
              description: s.description,
              status: 'done' as const,
              duration: `${Math.floor(Math.random() * 300) + 100}ms`,
            })),
            tool_calls: [{ name: 'mock_tool', title: '模拟工具调用' }],
            created_at: new Date().toISOString(),
            status: 'sent',
          })
        }

        const session = mockSessions.find((s) => s.id === sessionId)
        if (session) {
          session.last_message_at = new Date().toISOString()
        }

        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  }),

  // ── 3.1.7 提交评分 ──────────────────────────────────────────────────
  http.post(`${BASE_URL}/chat/sessions/:id/ratings`, async ({ params, request }) => {
    await delay(300)
    const { id } = params
    const body = (await request.json()) as {
      scores: Record<string, number>
      feedback_text?: string
    }
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: {
        id: `rating_${Date.now()}`,
        session_id: id,
        scores: body.scores ?? {},
        feedback_text: body.feedback_text ?? null,
        created_at: new Date().toISOString(),
      },
    })
  }),

  // ── 获取分身可用技能列表（mock）────────────────────────────────────
  http.get(`${BASE_URL}/chat/avatars/:avatarId/skills`, async () => {
    await delay(200)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: mockAvatarSkills,
    })
  }),
]
