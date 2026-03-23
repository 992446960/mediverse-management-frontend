import { http, HttpResponse, delay } from 'msw'
import { mockGlobalSkills } from '../data/globalSkills'

const BASE_URL = '/api/v1'

export const skillsHandlers = [
  // ── 3.2.1 查询技能列表 ─────────────────────────────────────────────
  http.get(`${BASE_URL}/skills`, async () => {
    await delay(200)
    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: mockGlobalSkills,
    })
  }),

  // ── 3.2.2 调用技能（SSE）──────────────────────────────────────────
  http.post(`${BASE_URL}/skills/:skillCode/execute`, async ({ params, request }) => {
    const skillCode = params.skillCode as string
    const body = (await request.json()) as { args?: Record<string, unknown> }
    const queryText = typeof body.args?.query === 'string' ? body.args.query : ''

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const steps = [
          { title: '加载知识库上下文', description: '正在解析 owner 与检索范围' },
          { title: '语义检索', description: '正在匹配相关卡片' },
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
          await delay(100)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'thinking_step',
                index: i,
                title: step.title,
                description: step.description,
                status: 'done',
                duration_ms: 120,
              })}\n\n`
            )
          )
          await delay(50)
        }

        const text = queryText || '(mock)'
        const snippet = `【${skillCode}】Mock：${text.slice(0, 80)}${text.length > 80 ? '…' : ''}`

        for (const char of snippet) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'delta', content: char })}\n\n`)
          )
          await delay(15)
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'done',
              skill_run_id: `skill_run_${Date.now()}`,
              tokens_used: 120,
              duration_ms: 400,
              result: {
                parts: [{ type: 'text', text: snippet }],
                citations: [
                  {
                    id: 'card_mock_1',
                    type: 'evidence',
                    title: 'Mock 引用',
                    content: '示例引用内容片段。',
                  },
                ],
              },
            })}\n\n`
          )
        )

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
]
