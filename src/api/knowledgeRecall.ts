import { request } from '@/api'
import type {
  KnowledgeRecallFormState,
  KnowledgeRecallOwnerType,
  KnowledgeRecallResult,
} from '@/types/knowledgeRecall'
import { buildKnowledgeRecallPayload } from '@/utils/knowledgeRecall'

export function recallKnowledgeCards(
  ownerType: KnowledgeRecallOwnerType,
  ownerId: string,
  state: KnowledgeRecallFormState
) {
  return request.post<KnowledgeRecallResult>(
    `/knowledge-recall/${ownerType}/${ownerId}/recall`,
    buildKnowledgeRecallPayload(state)
  )
}
