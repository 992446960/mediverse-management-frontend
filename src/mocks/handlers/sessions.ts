import { http, HttpResponse, delay } from 'msw'
import { mockSessions, mockMessages } from '../data/sessions'
import type { Session, Message } from '@/types/chat'

const BASE_URL = '/api/v1'

export const handlers = [
  // Get sessions
  http.get(`${BASE_URL}/sessions`, async ({ request }) => {
    await delay(300)
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') || 1)
    const pageSize = Number(url.searchParams.get('page_size') || 20)

    // Sort by updated_at desc
    const sorted = [...mockSessions].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )

    const start = (page - 1) * pageSize
    const end = start + pageSize
    const items = sorted.slice(start, end)

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

  // Create session
  http.post(`${BASE_URL}/sessions`, async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as { title?: string; avatar_id?: string }

    const newSession: Session = {
      id: `session_${Date.now()}`,
      title: body.title || '新会话',
      avatar_id: body.avatar_id || 'avatar_default',
      user_id: 'user_current',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
    }

    mockSessions.unshift(newSession)
    mockMessages[newSession.id] = []

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: newSession,
    })
  }),

  // Delete session
  http.delete(`${BASE_URL}/sessions/:id`, async ({ params }) => {
    await delay(300)
    const { id } = params
    const index = mockSessions.findIndex((s) => s.id === id)
    if (index !== -1) {
      mockSessions.splice(index, 1)
      delete mockMessages[id as string]
    }

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: null,
    })
  }),

  // Rename session
  http.patch(`${BASE_URL}/sessions/:id`, async ({ params, request }) => {
    await delay(300)
    const { id } = params
    const body = (await request.json()) as { title: string }

    const session = mockSessions.find((s) => s.id === id)
    if (session) {
      session.title = body.title
      session.updated_at = new Date().toISOString()
    }

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: null,
    })
  }),

  // Get messages
  http.get(`${BASE_URL}/sessions/:id/messages`, async ({ params }) => {
    await delay(300)
    const { id } = params
    const messages = mockMessages[id as string] || []

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: messages,
    })
  }),

  // Send message (SSE)
  http.post(`${BASE_URL}/sessions/:id/messages`, async ({ params, request }) => {
    const { id } = params
    const body = (await request.json()) as { content: string }
    const sessionId = id as string

    // 1. Save user message
    if (!mockMessages[sessionId]) mockMessages[sessionId] = []
    const userMsg: Message = {
      id: `msg_${Date.now()}_u`,
      session_id: sessionId,
      role: 'user',
      content: body.content,
      created_at: new Date().toISOString(),
      status: 'sent',
    }
    mockMessages[sessionId].push(userMsg)

    // 2. Prepare assistant response
    const assistantMsgId = `msg_${Date.now()}_a`
    const assistantMsg: Message = {
      id: assistantMsgId,
      session_id: sessionId,
      role: 'assistant',
      content: '',
      thinking_steps: [],
      created_at: new Date().toISOString(),
      status: 'sent', // Will be updated after stream
    }

    // 3. Stream response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Simulate thinking
        const steps = [
          { title: '理解意图', content: '正在分析用户问题...' },
          { title: '检索知识库', content: '正在搜索相关文档...' },
          { title: '生成回答', content: '正在组织语言...' },
        ]

        for (let i = 0; i < steps.length; i++) {
          const step = steps[i]
          if (!step) continue

          // Start step
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'thinking_step',
                index: i,
                title: step.title,
                content: '',
                status: 'thinking',
              })}\n\n`
            )
          )

          await delay(500)

          // Step content
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'thinking_step',
                index: i,
                content: step.content,
                status: 'done',
              })}\n\n`
            )
          )

          if (assistantMsg.thinking_steps) {
            assistantMsg.thinking_steps.push({
              title: step.title,
              content: step.content,
              status: 'done',
            })
          }
        }

        // Simulate text generation
        const responseText = `这是针对"${body.content}"的模拟回答。\n\n这里是流式输出的内容演示：\n1. 第一点...\n2. 第二点...\n3. 总结...`

        for (const char of responseText) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'delta',
                content: char,
              })}\n\n`
            )
          )
          assistantMsg.content += char
          await delay(30)
        }

        // Done
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'done',
              message_id: assistantMsgId,
            })}\n\n`
          )
        )

        if (mockMessages[sessionId]) {
          mockMessages[sessionId].push(assistantMsg)
        }

        // Update session last_message_at
        const session = mockSessions.find((s) => s.id === sessionId)
        if (session) {
          session.last_message_at = new Date().toISOString()
          session.updated_at = new Date().toISOString()
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

  // Rate message
  http.post(`${BASE_URL}/messages/:id/rate`, async () => {
    await delay(300)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: null,
    })
  }),
]
