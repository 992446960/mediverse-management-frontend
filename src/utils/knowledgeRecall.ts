import type {
  KnowledgeRecallFormState,
  KnowledgeRecallRequest,
  KnowledgeRecallResult,
  KnowledgeRecallSessionDetail,
  KnowledgeRecallViewModel,
} from '@/types/knowledgeRecall'
import type { CardType } from '@/types/knowledge'

export const ALL_RECALL_CARD_TYPES_VALUE = '__all__'

interface ResolveRecallCardTypeSelectionOptions {
  current: CardType[]
  clicked: CardType | typeof ALL_RECALL_CARD_TYPES_VALUE
  availableCardTypes: CardType[]
  allSelected: boolean
}

interface RecallCardTypeSelection {
  allSelected: boolean
  cardTypes: CardType[]
}

function uniqueAvailableCardTypes(types: CardType[]) {
  return Array.from(new Set(types.filter(Boolean)))
}

function selectedCoversAllAvailable(selected: CardType[], available: CardType[]) {
  const normalizedAvailable = uniqueAvailableCardTypes(available)
  if (normalizedAvailable.length === 0) return false

  const selectedSet = new Set(selected)
  return normalizedAvailable.every((type) => selectedSet.has(type))
}

export function resolveRecallCardTypeSelection({
  current,
  clicked,
  availableCardTypes,
  allSelected,
}: ResolveRecallCardTypeSelectionOptions): RecallCardTypeSelection {
  const available = uniqueAvailableCardTypes(availableCardTypes)

  if (clicked === ALL_RECALL_CARD_TYPES_VALUE) {
    if (allSelected) {
      return {
        allSelected: false,
        cardTypes: [],
      }
    }

    return {
      allSelected: true,
      cardTypes: available,
    }
  }

  if (allSelected) {
    return {
      allSelected: false,
      cardTypes: available.filter((type) => type !== clicked),
    }
  }

  const selected = new Set(current)
  if (selected.has(clicked)) {
    selected.delete(clicked)
  } else {
    selected.add(clicked)
  }

  return {
    allSelected: false,
    cardTypes: available.filter((type) => selected.has(type)),
  }
}

export function buildKnowledgeRecallPayload(
  state: KnowledgeRecallFormState
): KnowledgeRecallRequest {
  const payload: KnowledgeRecallRequest = {
    query: state.query,
    top_k: state.topK,
  }

  if (
    state.cardTypes.length > 0 &&
    !selectedCoversAllAvailable(state.cardTypes, state.availableCardTypes ?? [])
  ) {
    payload.metadata = {
      card_type: [...state.cardTypes],
    }
  }

  return payload
}

interface NormalizeRecallResultContext {
  topK: number
  cardTypes: CardType[]
}

function resolveSingleCardType(types: CardType[]): CardType | '' {
  return types.length === 1 ? (types[0] ?? '') : ''
}

export function normalizeKnowledgeRecallResult(
  result: KnowledgeRecallResult,
  context: NormalizeRecallResultContext
): KnowledgeRecallViewModel {
  return {
    query: result.query,
    answer: result.answer ?? '',
    cardType: resolveSingleCardType(context.cardTypes),
    topK: context.topK,
    count: result.count ?? result.sources.length,
    queryTimeMs: result.query_time_ms,
    confidence: result.confidence,
    sources: result.sources.map((source) => ({
      id: source.id,
      cardId: source.id || null,
      title: source.title || '-',
      cardType: source.card_type || '',
      excerpt: source.excerpt || '',
      score: source.recall_score ?? source.relevance_score ?? null,
      mdContent: source.md_content ?? '',
      jsonContent: source.json_content ?? '',
      sourceFiles: source.source_files ?? source.sources ?? [],
      tags: [],
      onlineStatus: null,
      auditStatus: null,
      auditRejectReason: null,
      referenceCount: null,
      createdAt: source.created_at ?? null,
      updatedAt: source.updated_at ?? null,
    })),
    citations: [],
    downstream: null,
  }
}

export function normalizeKnowledgeRecallSessionDetail(
  detail: KnowledgeRecallSessionDetail
): KnowledgeRecallViewModel {
  const sources = detail.retrieved_sources ?? []

  return {
    sessionId: detail.id,
    query: detail.query,
    answer: detail.final_answer ?? '',
    cardType: detail.card_type ?? '',
    topK: detail.topk ?? null,
    count: detail.card_count ?? sources.length,
    status: detail.recall_status,
    error: detail.error,
    token: detail.token,
    queryTimeMs: detail.latency_ms ?? detail.latency ?? null,
    createdAt: detail.created_at,
    updatedAt: detail.updated_at,
    sources: sources.map((source, index) => {
      const cardId = source.card_id ?? null
      return {
        id: cardId ?? `${detail.id}-source-${index}`,
        cardId,
        title: source.card_title || '-',
        cardType: source.card_type || '',
        excerpt: source.card_preview_content || '',
        score: source.recall_score ?? null,
        mdContent: source.md_content ?? '',
        jsonContent: source.json_content ?? '',
        sourceFiles: source.source_files ?? [],
        tags: source.tags ?? [],
        onlineStatus: source.online_status ?? null,
        auditStatus: source.audit_status ?? null,
        auditRejectReason: source.audit_reject_reason ?? null,
        referenceCount: source.reference_count ?? null,
        createdAt: source.created_at ?? null,
        updatedAt: source.updated_at ?? null,
      }
    }),
    citations: detail.citations ?? [],
    downstream: detail.downstream ?? null,
  }
}
