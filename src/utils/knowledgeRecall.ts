import type { KnowledgeRecallFormState, KnowledgeRecallRequest } from '@/types/knowledgeRecall'

export function buildKnowledgeRecallPayload(
  state: KnowledgeRecallFormState
): KnowledgeRecallRequest {
  const payload: KnowledgeRecallRequest = {
    query: state.query,
    top_k: state.topK,
  }

  if (state.cardTypes.length > 0) {
    payload.metadata = {
      card_type: [...state.cardTypes],
    }
  }

  return payload
}
