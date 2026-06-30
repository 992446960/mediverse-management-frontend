import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ALL_RECALL_CARD_TYPES_VALUE,
  buildKnowledgeRecallPayload,
  formatRecallHistoryCreatedAt,
  formatRecallHistoryLatency,
  formatRecallConfidence,
  formatRecallQueryTime,
  normalizeKnowledgeRecallResult,
  normalizeNonAgenticKnowledgeRecallResult,
  normalizeKnowledgeRecallSessionDetail,
  resolveRecallCardTypeSelection,
} from '../../src/utils/knowledgeRecall'

describe('knowledge recall payload', () => {
  it('does not send empty card_type when all card types are selected', () => {
    expect(
      buildKnowledgeRecallPayload({
        query: '如何进行知识库权限管理？',
        topK: 5,
        cardTypes: [],
      })
    ).toEqual({
      query: '如何进行知识库权限管理？',
      top_k: 5,
    })
  })

  it('sends selected card types as metadata.card_type', () => {
    expect(
      buildKnowledgeRecallPayload({
        query: '如何进行知识库权限管理？',
        topK: 8,
        cardTypes: ['rule', 'disease_overview'],
      })
    ).toEqual({
      query: '如何进行知识库权限管理？',
      top_k: 8,
      metadata: {
        card_type: ['rule', 'disease_overview'],
      },
    })
  })

  it('keeps recall card type payload values as backend codes', () => {
    expect(
      buildKnowledgeRecallPayload({
        query: '糖尿病',
        topK: 5,
        cardTypes: ['risk_point', 'pathway_clause'],
      })
    ).toEqual({
      query: '糖尿病',
      top_k: 5,
      metadata: {
        card_type: ['risk_point', 'pathway_clause'],
      },
    })
  })

  it('does not send card_type when selected card types cover all available types', () => {
    expect(
      buildKnowledgeRecallPayload({
        query: '如何进行知识库权限管理？',
        topK: 5,
        cardTypes: ['rule', 'disease_overview'],
        availableCardTypes: ['rule', 'disease_overview'],
      })
    ).toEqual({
      query: '如何进行知识库权限管理？',
      top_k: 5,
    })
  })

  it('sends owner ids and knowledge scope in metadata when provided', () => {
    expect(
      buildKnowledgeRecallPayload({
        query: '跨院区召回应如何限定范围？',
        topK: 6,
        cardTypes: [],
        ownerIds: ['owner-a', 'owner-b'],
        knowledgeScope: 'collective',
      })
    ).toEqual({
      query: '跨院区召回应如何限定范围？',
      top_k: 6,
      metadata: {
        owner_ids: ['owner-a', 'owner-b'],
        knowledge_scope: 'collective',
      },
    })
  })
})

describe('knowledge recall scope ui contract', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'src/views/shared/knowledge-recall-test/index.vue'),
    'utf8'
  )

  it('exposes knowledge scope options and submits selected scope', () => {
    expect(source).toContain('knowledge.recall.scopeLabel')
    expect(source).toContain('knowledge.recall.scopeCollective')
    expect(source).toContain('knowledge.recall.scopeIndividual')
    expect(source).toContain('knowledge.recall.scopeAll')
    expect(source).toContain("selectedKnowledgeScope = ref<KnowledgeScope>('collective')")
    expect(source).toContain('knowledgeScope: selectedKnowledgeScope.value')
  })

  it('uses a select control for knowledge scope selection', () => {
    expect(source).toContain('<a-select')
    expect(source).toContain('knowledge-recall-test__scope-select')
    expect(source).not.toContain('<a-segmented')
    expect(source).not.toContain('knowledge-recall-test__scope-segmented')
    expect(source).not.toContain('useSegmentedKnowledgeScopeControl')
  })
})

describe('knowledge recall result display contract', () => {
  it('uses compact query time formatting in result badges', () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        'src/views/shared/knowledge-recall-test/components/RecallResultSection.vue'
      ),
      'utf8'
    )

    expect(source).toContain('formatRecallQueryTime')
    expect(source).not.toContain('`${Math.round(value)}ms`')
  })
})

describe('knowledge recall card type loading contract', () => {
  it('does not cache recall card type options in localStorage', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/views/shared/knowledge-recall-test/composables/useRecallForm.ts'),
      'utf8'
    )

    expect(source).not.toContain('knowledge-recall-card-types')
    expect(source).not.toContain('localStorage')
  })
})

describe('knowledge recall card type selection', () => {
  const allTypes = ['rule', 'disease_overview', 'scale']

  it('selects all concrete types when all option is selected', () => {
    expect(
      resolveRecallCardTypeSelection({
        current: ['rule'],
        clicked: ALL_RECALL_CARD_TYPES_VALUE,
        availableCardTypes: allTypes,
        allSelected: false,
      })
    ).toEqual({
      allSelected: true,
      cardTypes: allTypes,
    })
  })

  it('clears all concrete types when all option is clicked while all is selected', () => {
    expect(
      resolveRecallCardTypeSelection({
        current: allTypes,
        clicked: ALL_RECALL_CARD_TYPES_VALUE,
        availableCardTypes: allTypes,
        allSelected: true,
      })
    ).toEqual({
      allSelected: false,
      cardTypes: [],
    })
  })

  it('removes all option when a concrete type is changed after all was selected', () => {
    expect(
      resolveRecallCardTypeSelection({
        current: allTypes,
        clicked: 'disease_overview',
        availableCardTypes: allTypes,
        allSelected: true,
      })
    ).toEqual({
      allSelected: false,
      cardTypes: ['rule', 'scale'],
    })
  })

  it('keeps all option unselected when concrete types are selected manually', () => {
    expect(
      resolveRecallCardTypeSelection({
        current: ['rule', 'disease_overview'],
        clicked: 'scale',
        availableCardTypes: allTypes,
        allSelected: false,
      })
    ).toEqual({
      allSelected: false,
      cardTypes: allTypes,
    })
  })
})

describe('knowledge recall view model', () => {
  it('normalizes agentic recall result', () => {
    const view = normalizeKnowledgeRecallResult(
      {
        query: '高血压如何诊断？',
        answer: '最终答案',
        confidence: 0.8,
        query_time_ms: 123,
        count: 1,
        cited_card_ids: ['card-1'],
        sources: [
          {
            id: 'card-1',
            card_type: 'rule',
            title: '诊断标准',
            excerpt: '摘要',
            relevance_score: 0.91,
            md_content: '## 正文',
            json_content: '{"a":1}',
            tags: ['高血压'],
            online_status: 'online',
            audit_status: 'approved',
            audit_reject_reason: null,
            reference_count: 3,
            created_at: '2026-05-25T10:00:00Z',
            updated_at: '2026-05-25T11:00:00Z',
            sources: [],
          },
        ],
      },
      { topK: 5, cardTypes: ['rule'] }
    )

    expect(view).toMatchObject({
      query: '高血压如何诊断？',
      answer: '最终答案',
      cardType: 'rule',
      topK: 5,
      count: 1,
      queryTimeMs: 123,
      confidence: 0.8,
      citedCardIds: ['card-1'],
      sources: [
        {
          id: 'card-1',
          cardId: 'card-1',
          title: '诊断标准',
          excerpt: '摘要',
          score: 0.91,
          mdContent: '## 正文',
          previewContentFallback: false,
          jsonContent: '{"a":1}',
          tags: ['高血压'],
          onlineStatus: 'online',
          auditStatus: 'approved',
          auditRejectReason: null,
          referenceCount: 3,
          createdAt: '2026-05-25T10:00:00Z',
          updatedAt: '2026-05-25T11:00:00Z',
        },
      ],
    })
  })

  it('normalizes non-agentic recall result without answer or count fields', () => {
    const view = normalizeNonAgenticKnowledgeRecallResult(
      {
        query: '知识卡批量操作',
        confidence: 0.64,
        query_time_ms: 88,
        cited_card_ids: ['card-2'],
        sources: [
          {
            id: 'card-2',
            card_type: 'risk_point',
            title: '批量删除风险',
            excerpt: '先确认所属权再删除',
            relevance_score: 0.72,
          },
        ],
      },
      { topK: 3, cardTypes: [] }
    )

    expect(view).toMatchObject({
      query: '知识卡批量操作',
      answer: '',
      count: 1,
      topK: 3,
      confidence: 0.64,
      queryTimeMs: 88,
      citedCardIds: ['card-2'],
      sources: [
        {
          id: 'card-2',
          cardId: 'card-2',
          title: '批量删除风险',
          excerpt: '先确认所属权再删除',
          score: 0.72,
          mdContent: '先确认所属权再删除',
          previewContentFallback: true,
        },
      ],
    })
  })

  it('normalizes session detail with retrieved source content', () => {
    const view = normalizeKnowledgeRecallSessionDetail({
      id: 'session-1',
      owner_type: 'org',
      owner_id: 'owner-1',
      query: '高血压如何诊断？',
      card_type: 'rule',
      topk: 8,
      final_answer: '历史答案',
      card_count: 1,
      confidence: 0.73,
      latency: 456,
      recall_status: 'success',
      created_at: '2026-05-25T10:00:00Z',
      updated_at: '2026-05-25T10:00:00Z',
      retrieved_sources: [
        {
          card_id: 'card-1',
          card_title: '诊断标准',
          card_type: 'rule',
          card_preview_content: '历史摘要',
          recall_score: 0.88,
          md_content: '## 历史正文',
          json_content: '{"b":2}',
          source_files: [],
        },
      ],
      citations: [],
      downstream: { http_status: 200, latency_ms: 456 },
      latency_ms: 456,
    })

    expect(view).toMatchObject({
      sessionId: 'session-1',
      query: '高血压如何诊断？',
      answer: '历史答案',
      cardType: 'rule',
      topK: 8,
      count: 1,
      status: 'success',
      queryTimeMs: 456,
      sources: [
        {
          id: 'card-1',
          cardId: 'card-1',
          title: '诊断标准',
          excerpt: '历史摘要',
          score: 0.88,
          mdContent: '## 历史正文',
          previewContentFallback: false,
          jsonContent: '{"b":2}',
        },
      ],
    })
    expect(view.confidence).toBeUndefined()
  })

  it('keeps a source displayable when card_id is null', () => {
    const view = normalizeKnowledgeRecallSessionDetail({
      id: 'session-1',
      owner_type: 'org',
      owner_id: 'owner-1',
      query: '问题',
      card_count: 1,
      recall_status: 'success',
      created_at: '2026-05-25T10:00:00Z',
      updated_at: '2026-05-25T10:00:00Z',
      retrieved_sources: [
        {
          card_id: null,
          card_title: '无 ID 卡片',
          card_preview_content: '摘要',
          md_content: '正文',
        },
      ],
    })

    expect(view.sources[0]).toMatchObject({
      cardId: null,
      title: '无 ID 卡片',
      mdContent: '正文',
      previewContentFallback: false,
    })
    expect(view.sources[0].id).toBe('session-1-source-0')
  })

  it('falls back to preview content when session source markdown is empty', () => {
    const view = normalizeKnowledgeRecallSessionDetail({
      id: 'session-1',
      owner_type: 'org',
      owner_id: 'owner-1',
      query: '问题',
      card_count: 1,
      recall_status: 'success',
      created_at: '2026-05-25T10:00:00Z',
      updated_at: '2026-05-25T10:00:00Z',
      retrieved_sources: [
        {
          card_id: 'card-1',
          card_title: '无 Markdown 卡片',
          card_preview_content: '预览正文',
          md_content: null,
          json_content: '{"title":"不展示为正文"}',
        },
      ],
    })

    expect(view.sources[0].mdContent).toBe('预览正文')
    expect(view.sources[0].previewContentFallback).toBe(true)
  })

  it('does not use json-like markdown as session source display content', () => {
    const view = normalizeKnowledgeRecallSessionDetail({
      id: 'session-1',
      owner_type: 'org',
      owner_id: 'owner-1',
      query: '问题',
      card_count: 1,
      recall_status: 'success',
      created_at: '2026-05-25T10:00:00Z',
      updated_at: '2026-05-25T10:00:00Z',
      retrieved_sources: [
        {
          card_id: 'card-1',
          card_title: '异常 Markdown 卡片',
          card_preview_content: '预览正文',
          md_content: '{"title":"这是 JSON"}',
        },
      ],
    })

    expect(view.sources[0].mdContent).toBe('预览正文')
    expect(view.sources[0].previewContentFallback).toBe(true)
  })
})

describe('knowledge recall history formatters', () => {
  it('formats result query time with compact millisecond and second units', () => {
    expect(formatRecallQueryTime(239)).toBe('239ms')
    expect(formatRecallQueryTime(999.4)).toBe('999ms')
    expect(formatRecallQueryTime(1000)).toBe('1s')
    expect(formatRecallQueryTime(1200)).toBe('1.2s')
    expect(formatRecallQueryTime(12400)).toBe('12.4s')
    expect(formatRecallQueryTime(0)).toBe('0ms')
    expect(formatRecallQueryTime(null)).toBe('-')
    expect(formatRecallQueryTime(Number.NaN)).toBe('-')
    expect(formatRecallQueryTime(-1)).toBe('-')
  })

  it('formats recall confidence with safe percent display', () => {
    expect(formatRecallConfidence(0.86)).toBe('86%')
    expect(formatRecallConfidence(86)).toBe('86%')
    expect(formatRecallConfidence(0)).toBe('0%')
    expect(formatRecallConfidence(null)).toBe('-')
    expect(formatRecallConfidence(Number.NaN)).toBe('-')
    expect(formatRecallConfidence(-1)).toBe('-')
  })

  it('formats history latency with safe units', () => {
    expect(formatRecallHistoryLatency(14.481)).toBe('14.48 s')
    expect(formatRecallHistoryLatency(0.006)).toBe('6 ms')
    expect(formatRecallHistoryLatency(0)).toBe('0 ms')
    expect(formatRecallHistoryLatency(null)).toBe('-')
    expect(formatRecallHistoryLatency(Number.NaN)).toBe('-')
    expect(formatRecallHistoryLatency(-1)).toBe('-')
  })

  it('formats history created time and handles invalid values', () => {
    expect(formatRecallHistoryCreatedAt('2026-05-25T08:47:41')).toBe('2026-05-25 08:47')
    expect(formatRecallHistoryCreatedAt(null)).toBe('-')
    expect(formatRecallHistoryCreatedAt('invalid')).toBe('-')
  })
})
