import { request } from '@/api'
import type {
  KnowledgeRecallFormState,
  KnowledgeRecallOwnerType,
  KnowledgeRecallResult,
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
