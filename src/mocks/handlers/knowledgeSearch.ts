import { http, HttpResponse, delay } from 'msw'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const history = new Map<string, { id: string; query: string; created_at: string }>()

function createSearchResponse(
  qaSessionId: string,
  query: string
): { qa_session_id: string; answer: string; citations: any[]; matched_files: any[] } {
  return {
    qa_session_id: qaSessionId,
    answer: `针对您的问题 **"${query}"**，根据知识库检索结果：\n\n1. **核心观点**：根据《2025诊疗指南》[1]，该症状通常建议采取保守治疗。\n2. **注意事项**：请注意观察患者体温变化[2]，若超过38.5度需及时就医。\n\n建议您参考相关文献进行进一步确认。`,
    citations: [
      {
        index: 1,
        card_id: 'card-1',
        card_title: '2025诊疗指南',
        card_type: 'evidence',
        relevance_score: 0.92,
        content_preview: '关于该症状的详细诊疗流程...',
      },
      {
        index: 2,
        card_id: 'card-2',
        card_title: '发热护理手册',
        card_type: 'rule',
        relevance_score: 0.85,
        content_preview: '体温监测与护理措施...',
      },
    ],
    matched_files: [
      {
        file_id: 'file-1',
        file_name: '内科诊疗指南.pdf',
        file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        relevance_score: 0.91,
      },
    ],
  }
}

export const knowledgeSearchHandlers = [
  http.post(`${API_BASE}/knowledge-qa/search`, async ({ request }) => {
    await delay(400)
    const body = (await request.json()) as { query: string; top_k?: number }
    if (!body.query?.trim()) {
      return HttpResponse.json({ code: 400, message: 'query is required' }, { status: 400 })
    }
    const id = `qa-${Date.now()}`
    const item = {
      id,
      query: body.query,
      created_at: new Date().toISOString(),
    }
    history.set(id, item)
    const data = createSearchResponse(id, body.query)
    return HttpResponse.json({ code: 0, data, message: 'ok' })
  }),

  http.post(`${API_BASE}/knowledge-qa/follow-up`, async ({ request }) => {
    await delay(400)
    const body = (await request.json()) as { qa_session_id: string; query: string }
    if (!body.qa_session_id || !body.query?.trim()) {
      return HttpResponse.json(
        { code: 400, message: 'qa_session_id and query are required' },
        { status: 400 }
      )
    }
    const id = body.qa_session_id
    const data = createSearchResponse(id, body.query)
    return HttpResponse.json({ code: 0, data, message: 'ok' })
  }),

  http.get(`${API_BASE}/knowledge-qa/history`, async ({ request }) => {
    await delay(200)
    const url = new URL(request.url)
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(url.searchParams.get('limit') || '10', 10))
    )
    const list = Array.from(history.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
    return HttpResponse.json({ code: 0, data: list, message: 'ok' })
  }),
]
