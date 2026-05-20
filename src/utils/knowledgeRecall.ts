import type { KnowledgeRecallFormState, KnowledgeRecallRequest } from '@/types/knowledgeRecall'
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
