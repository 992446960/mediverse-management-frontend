import { http, HttpResponse, delay } from 'msw'

const sessions = new Map()
const messages = new Map()

// Helper to create a stream
function createStream(content: string, citations: any[] = [], relatedQuestions: string[] = []) {
  const encoder = new TextEncoder()
  return new ReadableStream({
    async start(controller) {
      // Thinking steps
      const steps = [
        { title: '分析用户意图', content: '用户正在询问关于...', duration: 500 },
        { title: '检索知识库', content: '正在检索相关文档...', duration: 800 },
        { title: '生成回答', content: '整理检索结果并生成回答...', duration: 600 },
      ]

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'thinking_step',
              index: i,
              title: step.title,
              status: 'pending',
            })}\n\n`
          )
        )

        await delay(step.duration / 2)

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'thinking_step',
              index: i,
              content: step.content,
              status: 'pending',
            })}\n\n`
          )
        )

        await delay(step.duration / 2)

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'thinking_step',
              index: i,
              status: 'success',
              duration: step.duration,
            })}\n\n`
          )
        )
      }

      // Content delta
      const chars = content.split('')
      for (const char of chars) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'delta',
              content: char,
            })}\n\n`
          )
        )
        await delay(30)
      }

      // Citations and Related Questions are usually part of the final message or sent as metadata
      // For SSE, we might send them as a special event or just assume the client fetches the full message later
      // But here we can simulate them being part of the 'done' event or just implicit in the content (citations)

      // Done
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'done',
            message_id: Date.now().toString(),
            citations,
            relatedQuestions,
          })}\n\n`
        )
      )

      controller.close()
    },
  })
}

export const knowledgeSearchHandlers = [
  // Get sessions
  http.get('/api/knowledge-search/sessions', async () => {
    await delay(300)
    return HttpResponse.json({
      list: Array.from(sessions.values()).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
      total: sessions.size,
    })
  }),

  // Create session
  http.post('/api/knowledge-search/sessions', async ({ request }) => {
    const body = (await request.json()) as { query: string }
    const id = Date.now().toString()
    const session = {
      id,
      title: body.query || '新会话',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    sessions.set(id, session)
    messages.set(id, [])
    return HttpResponse.json(session)
  }),

  // Delete session
  http.delete('/api/knowledge-search/sessions/:id', async ({ params }) => {
    sessions.delete(params.id)
    messages.delete(params.id)
    return new HttpResponse(null, { status: 200 })
  }),

  // Get messages
  http.get('/api/knowledge-search/sessions/:id/messages', async ({ params }) => {
    await delay(200)
    const msgs = messages.get(params.id) || []
    return HttpResponse.json(msgs)
  }),

  // Send message (SSE)
  http.post('/api/knowledge-search/sessions/:id/messages', async ({ params, request }) => {
    const body = (await request.json()) as { content: string }
    const sessionId = params.id as string

    // Save user message
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: body.content,
      createdAt: new Date().toISOString(),
    }
    const sessionMessages = messages.get(sessionId) || []
    sessionMessages.push(userMsg)

    // Prepare assistant response
    const mockResponse = `针对您的问题 **"${body.content}"**，根据知识库检索结果：

1. **核心观点**：根据《2025诊疗指南》[1]，该症状通常建议采取保守治疗。
2. **注意事项**：请注意观察患者体温变化[2]，若超过38.5度需及时就医。

建议您参考相关文献进行进一步确认。`

    const citations = [
      { id: '1', title: '2025诊疗指南', content: '关于该症状的详细诊疗流程...', url: '#' },
      { id: '2', title: '发热护理手册', content: '体温监测与护理措施...', url: '#' },
    ]

    const relatedQuestions = [
      '保守治疗的具体方案是什么？',
      '什么时候需要手术干预？',
      '有哪些饮食禁忌？',
    ]

    // Save assistant message (placeholder, will be updated by client via SSE but here we simulate backend state)
    const assistantMsg = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: mockResponse,
      createdAt: new Date().toISOString(),
      citations,
      relatedQuestions,
      thinkingSteps: [
        { title: '分析用户意图', status: 'success', duration: 500 },
        { title: '检索知识库', status: 'success', duration: 800 },
        { title: '生成回答', status: 'success', duration: 600 },
      ],
    }
    sessionMessages.push(assistantMsg)
    messages.set(sessionId, sessionMessages)

    // Update session timestamp
    const session = sessions.get(sessionId)
    if (session) {
      session.updatedAt = new Date().toISOString()
      sessions.set(sessionId, session)
    }

    const stream = createStream(mockResponse, citations, relatedQuestions)

    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
      },
    })
  }),
]
