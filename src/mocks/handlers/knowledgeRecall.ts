import { http, HttpResponse, delay } from 'msw'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const recallSources = [
  {
    id: 'card_001',
    card_type: 'evidence',
    title: '高血压诊断标准',
    excerpt: '非同日3次测量血压，收缩压≥140mmHg和/或舒张压≥90mmHg即可诊断。',
    relevance_score: 0.96,
    recall_score: 0.96,
  },
  {
    id: 'card_002',
    card_type: 'rule',
    title: '降压药物选用原则',
    excerpt: '初始治疗小剂量开始，优先选择长效制剂，高危患者可考虑联合用药。',
    relevance_score: 0.88,
    recall_score: 0.88,
  },
  {
    id: 'card_004',
    card_type: 'risk_point',
    title: '住院患者跌倒风险评分',
    excerpt: '高龄、步态不稳、近期使用镇静药物的住院患者需完成跌倒风险评分。',
    relevance_score: 0.79,
    recall_score: 0.79,
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
