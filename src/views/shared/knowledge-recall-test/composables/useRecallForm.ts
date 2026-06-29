import { getCardTypes } from '@/api/knowledge'
import type { CardType, CardTypeOption } from '@/types/knowledge'
import {
  ALL_RECALL_CARD_TYPES_VALUE,
  resolveRecallCardTypeSelection,
} from '@/utils/knowledgeRecall'

export function useRecallForm() {
  const cardTypes = ref<CardTypeOption[]>([])
  const cardTypesLoading = ref(false)
  const selectedAllCardTypes = ref(true)
  const selectedCardTypes = ref<CardType[]>([])

  const availableCardTypes = computed(() => cardTypes.value.map((item) => item.code))
  const hasSelectedCardType = computed(
    () => selectedAllCardTypes.value || selectedCardTypes.value.length > 0
  )

  function syncCardTypesSelection() {
    if (selectedAllCardTypes.value) {
      selectedCardTypes.value = [...availableCardTypes.value]
      return
    }

    const available = new Set(availableCardTypes.value)
    selectedCardTypes.value = selectedCardTypes.value.filter((type) => available.has(type))
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
    cardTypesLoading.value = true
    try {
      const remoteCardTypes = await getCardTypes()
      cardTypes.value = remoteCardTypes
      syncCardTypesSelection()
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
    syncCardTypesSelection,
    isCardTypeActive,
    handleCardTypeClick,
  }
}
