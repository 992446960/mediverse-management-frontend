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
    json_content: '{"title":"高血压诊断标准","threshold":"140/90mmHg"}',
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
    tags: ['高血压', '诊断'],
    online_status: 'online',
    audit_status: 'approved',
    audit_reject_reason: null,
    reference_count: 4,
    created_at: '2024-03-01T18:00:00Z',
    updated_at: '2024-03-01T18:30:00Z',
  },
  {
    id: 'card_002',
    card_type: 'rule',
    title: '降压药物选用原则',
    excerpt: '初始治疗小剂量开始，优先选择长效制剂，高危患者可考虑联合用药。',
    relevance_score: 0.88,
    recall_score: 0.88,
    json_content: '{"title":"降压药物选用原则","strategy":"小剂量长效制剂"}',
    md_content:
      '## 降压药物选用原则\n\n- 初始治疗从小剂量开始。\n- 优先选择长效制剂。\n- 高危患者可结合病情考虑联合用药。',
    sources: [],
    tags: ['用药', '指南'],
    online_status: 'online',
    audit_status: 'approved',
    audit_reject_reason: null,
    reference_count: 2,
    created_at: '2024-03-02T09:00:00Z',
    updated_at: '2024-03-02T09:15:00Z',
  },
  {
    id: 'card_004',
    card_type: 'risk_point',
    title: '住院患者跌倒风险评分',
    excerpt: '高龄、步态不稳、近期使用镇静药物的住院患者需完成跌倒风险评分。',
    relevance_score: 0.79,
    recall_score: 0.79,
    json_content:
      '{"title":"住院患者跌倒风险评分","risk_factors":["高龄","步态不稳","近期使用镇静药物"]}',
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
    tags: ['住院安全'],
    online_status: 'offline',
    audit_status: 'approved',
    audit_reject_reason: null,
    reference_count: 1,
    created_at: '2024-03-03T11:00:00Z',
    updated_at: '2024-03-03T11:20:00Z',
  },
]

const recallHistorySessions = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    owner_type: 'org',
    owner_id: '22222222-2222-4222-8222-222222222222',
    query: '高血压患者如何进行诊断？',
    card_type: 'disease_overview',
    topk: 5,
    final_answer: '历史记录显示，本次召回命中了高血压诊断标准等知识卡。',
    card_count: 2,
    confidence: 0.86,
    latency: 0.42,
    token: 1024,
    error: null,
    recall_status: 'success',
    created_at: '2026-05-25T08:00:00Z',
    updated_at: '2026-05-25T08:00:00Z',
    retrieved_sources: recallSources.slice(0, 2).map((source) => ({
      card_id: source.id,
      recall_score: source.recall_score,
      card_title: source.title,
      card_type: source.card_type,
      card_preview_content: source.excerpt,
      json_content: source.json_content ?? '',
      md_content: source.md_content ?? '',
      source_files: source.sources,
      tags: ['mock'],
      online_status: 'online',
      audit_status: 'approved',
      audit_reject_reason: null,
      reference_count: 3,
      created_at: source.updated_at,
      updated_at: source.updated_at,
    })),
    citations: [],
    downstream: {
      url: 'mock://knowledge-recall/agentic-search',
      http_status: 200,
      sync_code: 'ok',
      latency_ms: 420,
      message: 'ok',
    },
    latency_ms: 420,
  },
]

export const knowledgeRecallHandlers = [
  http.get(`${API_BASE}/knowledge-recall/:ownerType/:ownerId/history`, ({ request }) => {
    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('page_size')) || 20))
    const cardType = url.searchParams.get('card_type')
    const recallStatus = url.searchParams.get('recall_status')
    const filtered = recallHistorySessions.filter((item) => {
      if (cardType && item.card_type !== cardType) return false
      if (recallStatus && item.recall_status !== recallStatus) return false
      return true
    })
    const start = (page - 1) * pageSize

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: {
        total: filtered.length,
        page,
        page_size: pageSize,
        items: filtered.slice(start, start + pageSize).map((item) => ({
          id: item.id,
          owner_type: item.owner_type,
          owner_id: item.owner_id,
          query: item.query,
          card_type: item.card_type,
          topk: item.topk,
          final_answer: item.final_answer,
          card_count: item.card_count,
          confidence: item.confidence,
          latency: item.latency,
          token: item.token,
          error: item.error,
          recall_status: item.recall_status,
          created_at: item.created_at,
          updated_at: item.updated_at,
        })),
      },
    })
  }),
  http.get(`${API_BASE}/knowledge-recall/sessions/:sessionId`, ({ params }) => {
    const session = recallHistorySessions.find((item) => item.id === params.sessionId)
    if (!session) {
      return HttpResponse.json(
        { code: 404, message: 'session not found', data: null },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: session,
    })
  }),
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
          cited_card_ids: sources.map((source) => source.id),
          sources,
        },
      })
    }
  ),
  http.post(`${API_BASE}/knowledge-recall/:ownerType/:ownerId/search`, async ({ request }) => {
    await delay(300)
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
    const sources = filtered.slice(0, topK).map((source) => ({
      id: source.id,
      card_type: source.card_type,
      title: source.title,
      excerpt: source.excerpt,
      relevance_score: source.relevance_score,
    }))

    return HttpResponse.json({
      code: 0,
      message: 'ok',
      data: {
        query,
        sources,
        cited_card_ids: sources.map((source) => source.id),
        confidence: sources.length > 0 ? 0.82 : 0.2,
        query_time_ms: 260,
      },
    })
  }),
]
