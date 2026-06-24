import { request } from '@/api'
import type {
  KnowledgeRecallFormState,
  KnowledgeRecallHistoryParams,
  KnowledgeRecallHistoryResponse,
  KnowledgeRecallOwnerType,
  KnowledgeRecallResult,
  NonAgenticKnowledgeRecallResult,
  KnowledgeRecallSessionDetail,
} from '@/types/knowledgeRecall'
import { buildKnowledgeRecallPayload } from '@/utils/knowledgeRecall'

const KNOWLEDGE_RECALL_TIMEOUT = 600_000

export function recallKnowledgeCards(
  ownerType: KnowledgeRecallOwnerType,
  ownerId: string,
  state: KnowledgeRecallFormState
) {
  return request.post<KnowledgeRecallResult>(
    `/knowledge-recall/${ownerType}/${ownerId}/recall`,
    buildKnowledgeRecallPayload(state),
    { timeout: KNOWLEDGE_RECALL_TIMEOUT }
  )
}

export function searchKnowledgeCards(
  ownerType: KnowledgeRecallOwnerType,
  ownerId: string,
  state: KnowledgeRecallFormState
) {
  return request.post<NonAgenticKnowledgeRecallResult>(
    `/knowledge-recall/${ownerType}/${ownerId}/search`,
    buildKnowledgeRecallPayload(state),
    { timeout: KNOWLEDGE_RECALL_TIMEOUT }
  )
}

export function getKnowledgeRecallHistory(
  ownerType: KnowledgeRecallOwnerType,
  ownerId: string,
  params: KnowledgeRecallHistoryParams
) {
  return request.get<KnowledgeRecallHistoryResponse>(
    `/knowledge-recall/${ownerType}/${ownerId}/history`,
    { params }
  )
}

export function getKnowledgeRecallSessionDetail(sessionId: string) {
  return request.get<KnowledgeRecallSessionDetail>(`/knowledge-recall/sessions/${sessionId}`)
}
