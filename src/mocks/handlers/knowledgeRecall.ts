import { http, HttpResponse, delay } from 'msw'

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const recallSources = [
  {
    id: 'card_001',
    card_type: 'disease_overview',
    title: '高血压诊断标准',
    excerpt: '非同日3次测量血压，收缩压≥140mmHg和/或舒张压≥90mmHg即可诊断。',
    relevance_score: 0.96,
    recall_score: 0.96,
    md_content:
      '## 高血压诊断标准\n\n根据《中国高血压防治指南》，非同日 3 次测量血压，收缩压≥140mmHg 和/或舒张压≥90mmHg 即可诊断为高血压。',
    sources: [
      {
        id: 'file_001',
        file_name: '中国高血压防治指南2018.pdf',
        file_type: 'pdf',
        file_size: 2_456_320,
        storage_url: 'mock://files/hypertension-guide.pdf',
        parsed_file_url: null,
        page_hint: '第 12 页',
      },
    ],
    updated_at: '2024-03-01T18:30:00Z',
  },
  {
    id: 'card_002',
    card_type: 'rule',
    title: '降压药物选用原则',
    excerpt: '初始治疗小剂量开始，优先选择长效制剂，高危患者可考虑联合用药。',
    relevance_score: 0.88,
    recall_score: 0.88,
    md_content:
      '## 降压药物选用原则\n\n- 初始治疗从小剂量开始。\n- 优先选择长效制剂。\n- 高危患者可结合病情考虑联合用药。',
    sources: [],
    updated_at: '2024-03-02T09:15:00Z',
  },
  {
    id: 'card_004',
    card_type: 'risk_point',
    title: '住院患者跌倒风险评分',
    excerpt: '高龄、步态不稳、近期使用镇静药物的住院患者需完成跌倒风险评分。',
    relevance_score: 0.79,
    recall_score: 0.79,
    md_content:
      '```json\n{\n  "title": "住院患者跌倒风险评分",\n  "risk_factors": ["高龄", "步态不稳", "近期使用镇静药物"]\n}\n```',
    sources: [
      {
        id: 'file_002',
        file_name: '住院患者安全管理规范.docx',
        file_type: 'docx',
        file_size: 1_024_000,
        storage_url: 'mock://files/inpatient-safety.docx',
        parsed_file_url: null,
        page_hint: null,
      },
    ],
    updated_at: '2024-03-03T11:20:00Z',
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
