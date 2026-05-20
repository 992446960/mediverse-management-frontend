import { http, HttpResponse, delay } from 'msw'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const recallSources = [
  {
    id: 'recall-card-1',
    card_type: 'rule',
    title: '知识库权限管理规范',
    excerpt: '知识库权限按个人、科室、机构三类 owner 隔离，并由对应角色维护。',
    relevance_score: 0.96,
  },
  {
    id: 'recall-card-2',
    card_type: 'evidence',
    title: '知识卡审核与上线流程',
    excerpt: '知识卡审核通过后才允许上线；待审核与已驳回状态不进入正式召回范围。',
    relevance_score: 0.88,
  },
  {
    id: 'recall-card-3',
    card_type: 'pathway_clause',
    title: '工作台知识卡使用说明',
    excerpt: '用户在所属工作台中维护文件和知识卡，召回时默认限定当前工作台范围。',
    relevance_score: 0.79,
  },
]

export const knowledgeRecallHandlers = [
  http.post(
    `${API_BASE}/knowledge-recall/:ownerType/:ownerId/recall`,
    async ({ request, params }) => {
      await delay(500)
      const ownerType = String(params.ownerType ?? '')
      const ownerId = String(params.ownerId ?? '')
      if (!ownerType || !ownerId) {
        return HttpResponse.json(
          { code: 400, message: 'owner is required', data: null },
          { status: 400 }
        )
      }

      const body = (await request.json()) as {
        query?: string
        top_k?: number
        metadata?: { card_type?: string[] }
      }
      const query = body.query?.trim()
      if (!query) {
        return HttpResponse.json({ code: 400, message: 'query is required' }, { status: 400 })
      }

      const topK = Math.min(20, Math.max(1, Number(body.top_k) || 5))
      const selectedTypes = body.metadata?.card_type ?? []
      const filtered =
        selectedTypes.length > 0
          ? recallSources.filter((source) => selectedTypes.includes(source.card_type))
          : recallSources
      const sources = filtered.slice(0, topK)

      return HttpResponse.json({
        code: 0,
        message: 'ok',
        data: {
          query,
          answer: `基于当前知识库召回结果，建议先确认用户所属工作台，再按知识卡审核状态和上线状态管理权限。问题「${query}」命中了 ${sources.length} 条知识卡。`,
          confidence: sources.length > 0 ? 0.86 : 0.3,
          query_time_ms: 420,
          count: sources.length,
          sources,
        },
      })
    }
  ),
]
