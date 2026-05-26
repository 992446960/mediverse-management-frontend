import { getCardTypes } from '@/api/knowledge'
import type { CardType, CardTypeOption } from '@/types/knowledge'
import {
  ALL_RECALL_CARD_TYPES_VALUE,
  resolveRecallCardTypeSelection,
} from '@/utils/knowledgeRecall'

const CARD_TYPES_CACHE_KEY = 'knowledge-recall-card-types'

function isCardTypeOption(item: unknown): item is CardTypeOption {
  if (!item || typeof item !== 'object') return false

  const record = item as Record<string, unknown>
  return typeof record.name === 'string' && typeof record.code === 'string'
}

function readCachedCardTypes(): CardTypeOption[] {
  try {
    const raw = localStorage.getItem(CARD_TYPES_CACHE_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(isCardTypeOption)
  } catch {
    return []
  }
}

function writeCachedCardTypes(types: CardTypeOption[]) {
  if (types.length === 0) return

  try {
    localStorage.setItem(CARD_TYPES_CACHE_KEY, JSON.stringify(types))
  } catch {
    return
  }
}

export function useRecallForm() {
  const cardTypes = ref<CardTypeOption[]>([])
  const cardTypesLoading = ref(false)
  const selectedAllCardTypes = ref(true)
  const selectedCardTypes = ref<CardType[]>([])

  const availableCardTypes = computed(() => cardTypes.value.map((item) => item.code))
  const hasSelectedCardType = computed(
    () => selectedAllCardTypes.value || selectedCardTypes.value.length > 0
  )

  function syncAllCardTypesSelection() {
    if (!selectedAllCardTypes.value) return
    selectedCardTypes.value = [...availableCardTypes.value]
  }

  function resetCardTypes() {
    selectedAllCardTypes.value = true
    selectedCardTypes.value = [...availableCardTypes.value]
  }

  function isCardTypeActive(type: CardType) {
    return selectedAllCardTypes.value || selectedCardTypes.value.includes(type)
  }

  function handleCardTypeClick(clicked: CardType | typeof ALL_RECALL_CARD_TYPES_VALUE) {
    const selection = resolveRecallCardTypeSelection({
      current: selectedCardTypes.value,
      clicked,
      availableCardTypes: availableCardTypes.value,
      allSelected: selectedAllCardTypes.value,
    })

    selectedAllCardTypes.value = selection.allSelected
    selectedCardTypes.value = selection.cardTypes
  }

  async function fetchCardTypes() {
    const cachedCardTypes = readCachedCardTypes()
    if (cachedCardTypes.length > 0) {
      cardTypes.value = cachedCardTypes
      syncAllCardTypesSelection()
      return
    }

    cardTypesLoading.value = true
    try {
      const remoteCardTypes = await getCardTypes()
      cardTypes.value = remoteCardTypes
      writeCachedCardTypes(remoteCardTypes)
      syncAllCardTypesSelection()
    } catch {
      cardTypes.value = []
    } finally {
      cardTypesLoading.value = false
    }
  }

  return {
    cardTypes,
    cardTypesLoading,
    selectedAllCardTypes,
    selectedCardTypes,
    availableCardTypes,
    hasSelectedCardType,
    fetchCardTypes,
    resetCardTypes,
    syncAllCardTypesSelection,
    isCardTypeActive,
    handleCardTypeClick,
  }
}
