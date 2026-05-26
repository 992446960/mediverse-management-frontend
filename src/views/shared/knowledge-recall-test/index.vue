<template>
  <div class="knowledge-recall-test flex flex-1 flex-col overflow-y-auto">
    <header class="knowledge-recall-test__header app-container mb-4">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div class="flex min-w-0 items-start gap-3">
          <a-button
            type="link"
            class="knowledge-recall-test__back shrink-0 px-0 text-sm text-slate-500 hover:text-primary"
            @click="handleBack"
          >
            <template #icon>
              <ArrowLeftOutlined />
            </template>
            {{ t('common.back') }}
          </a-button>
          <div class="min-w-0 pt-0.5">
            <h1 class="m-0 text-xl font-semibold leading-7 text-(--color-text-base)">
              {{ t('knowledge.recall.title') }}
            </h1>
            <p class="m-0 mt-1 text-sm leading-5 text-(--color-text-secondary)">
              {{ t('knowledge.recall.subtitle') }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <a-button :disabled="loading" @click="openHistoryModal">
            <template #icon>
              <HistoryOutlined />
            </template>
            {{ t('knowledge.recall.historyEntry') }}
          </a-button>
          <a-button :disabled="loading || !canReset" @click="handleReset">
            <template #icon>
              <UndoOutlined />
            </template>
            {{ t('knowledge.recall.reset') }}
          </a-button>
          <a-button type="primary" :loading="loading" :disabled="!canSubmit" @click="handleRecall">
            <template #icon>
              <CaretRightOutlined />
            </template>
            {{ t('knowledge.recall.execute') }}
          </a-button>
        </div>
      </div>
    </header>

    <div class="knowledge-recall-test__form-grid mb-4">
      <section class="app-container min-w-0 p-5">
        <div class="mb-3 flex items-center justify-between gap-3">
          <h2 class="m-0 flex items-center gap-2 text-base font-semibold text-(--color-text-base)">
            <QuestionCircleOutlined class="text-primary" />
            {{ t('knowledge.recall.queryLabel') }}
          </h2>
          <span class="text-xs text-(--color-text-tertiary)"> {{ query.length }} / 2000 </span>
        </div>
        <a-textarea
          v-model:value="query"
          :placeholder="t('knowledge.recall.queryPlaceholder')"
          :auto-size="{ minRows: 8, maxRows: 12 }"
          :maxlength="2000"
          :disabled="loading"
        />
      </section>

      <aside class="app-container min-w-0 p-5">
        <div class="mb-5 flex items-center gap-2">
          <FilterOutlined class="text-primary" />
          <h2 class="m-0 text-base font-semibold text-(--color-text-base)">
            {{ t('knowledge.recall.paramsTitle') }}
          </h2>
        </div>

        <div class="mb-5">
          <div class="mb-2 text-sm font-medium text-(--color-text-base)">
            {{ t('knowledge.recall.cardTypeLabel') }}
          </div>
          <a-spin :spinning="cardTypesLoading" size="small">
            <div class="flex flex-wrap gap-2">
              <a-button
                size="small"
                :type="selectedAllCardTypes ? 'primary' : 'default'"
                :disabled="loading"
                @click="handleCardTypeClick(ALL_RECALL_CARD_TYPES_VALUE)"
              >
                {{ t('knowledge.recall.allTypes') }}
              </a-button>
              <a-button
                v-for="item in cardTypes"
                :key="item.code"
                size="small"
                :type="isCardTypeActive(item.code) ? 'primary' : 'default'"
                :disabled="loading"
                @click="handleCardTypeClick(item.code)"
              >
                {{ item.name }}
              </a-button>
            </div>
          </a-spin>
          <p
            v-if="!hasSelectedCardType"
            class="m-0 mt-2 text-xs leading-5 text-(--ant-color-error)"
          >
            {{ t('knowledge.recall.cardTypeRequired') }}
          </p>
        </div>

        <div>
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-sm font-medium text-(--color-text-base)">
              {{ t('knowledge.recall.topKLabel') }}
            </span>
            <a-input-number
              v-model:value="topK"
              :min="1"
              :max="20"
              :precision="0"
              :disabled="loading"
            />
          </div>
          <a-slider
            v-model:value="topK"
            class="knowledge-recall-test__top-k-slider"
            :min="1"
            :max="20"
            :disabled="loading"
          />
          <div class="flex justify-between text-xs text-(--color-text-tertiary)">
            <span>1</span>
            <span>20</span>
          </div>
        </div>
      </aside>
    </div>

    <div
      class="mb-4 flex items-center gap-3 text-xs font-semibold tracking-wide text-(--color-text-tertiary)"
    >
      <div class="h-px flex-1 bg-(--color-border)" />
      <span>{{ t('knowledge.recall.resultTitle') }}</span>
      <div class="h-px flex-1 bg-(--color-border)" />
    </div>

    <RecallResultSection
      :result="result"
      :loading="loading"
      @open-source-detail="handleOpenSourceDetail"
    />

    <RecallHistoryModal
      v-model:open="historyOpen"
      :owner-type="ownerType"
      :owner-id="ownerId"
      :card-types="cardTypes"
      @select="handleSelectHistory"
    />

    <RecallSourceDetailModal v-model:open="detailOpen" :source="selectedSource" />
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  FilterOutlined,
  CaretRightOutlined,
  UndoOutlined,
  HistoryOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import { recallKnowledgeCards } from '@/api/knowledgeRecall'
import type {
  KnowledgeRecallOwnerType,
  KnowledgeRecallViewModel,
  KnowledgeRecallViewSource,
} from '@/types/knowledgeRecall'
import {
  ALL_RECALL_CARD_TYPES_VALUE,
  normalizeKnowledgeRecallResult,
} from '@/utils/knowledgeRecall'
import RecallHistoryModal from './components/RecallHistoryModal.vue'
import RecallResultSection from './components/RecallResultSection.vue'
import RecallSourceDetailModal from './components/RecallSourceDetailModal.vue'
import { useRecallForm } from './composables/useRecallForm'
import 'github-markdown-css/github-markdown-light.css'

const props = defineProps<{
  ownerType: KnowledgeRecallOwnerType
  ownerId: string
}>()

const { t } = useI18n()
const router = useRouter()
const {
  cardTypes,
  cardTypesLoading,
  selectedAllCardTypes,
  selectedCardTypes,
  availableCardTypes,
  hasSelectedCardType,
  fetchCardTypes,
  resetCardTypes,
  isCardTypeActive,
  handleCardTypeClick,
} = useRecallForm()

const query = ref('')
const topK = ref(5)
const loading = ref(false)
const result = ref<KnowledgeRecallViewModel | null>(null)
const detailOpen = ref(false)
const selectedSource = ref<KnowledgeRecallViewSource | null>(null)
const historyOpen = ref(false)

const normalizedTopK = computed(() => Math.min(20, Math.max(1, Number(topK.value) || 5)))
const canSubmit = computed(
  () => query.value.trim().length > 0 && props.ownerId !== '' && hasSelectedCardType.value
)
const canReset = computed(
  () =>
    query.value.length > 0 ||
    topK.value !== 5 ||
    !selectedAllCardTypes.value ||
    result.value !== null
)

function handleReset() {
  query.value = ''
  topK.value = 5
  resetCardTypes()
  result.value = null
}

function handleBack() {
  router.go(-1)
}

async function handleRecall() {
  const text = query.value.trim()
  if (!text) {
    message.warning(t('knowledge.recall.queryRequired'))
    return
  }
  if (!props.ownerId) {
    message.warning(t('knowledge.recall.ownerMissing'))
    return
  }
  if (!hasSelectedCardType.value) {
    message.warning(t('knowledge.recall.cardTypeRequired'))
    return
  }

  loading.value = true
  result.value = null
  try {
    const data = await recallKnowledgeCards(props.ownerType, props.ownerId, {
      query: text,
      topK: normalizedTopK.value,
      cardTypes: selectedCardTypes.value,
      availableCardTypes: availableCardTypes.value,
    })
    result.value = normalizeKnowledgeRecallResult(data, {
      topK: normalizedTopK.value,
      cardTypes: selectedCardTypes.value,
    })
  } catch {
    result.value = null
  } finally {
    loading.value = false
  }
}

function openHistoryModal() {
  if (loading.value) return
  historyOpen.value = true
}

function handleSelectHistory(view: KnowledgeRecallViewModel) {
  result.value = view
  query.value = view.query
  topK.value = view.topK ?? 5
  if (view.cardType) {
    selectedAllCardTypes.value = false
    selectedCardTypes.value = [view.cardType]
  } else {
    resetCardTypes()
  }
  selectedSource.value = null
  detailOpen.value = false
}

function handleOpenSourceDetail(source: KnowledgeRecallViewSource) {
  selectedSource.value = source
  detailOpen.value = true
}

onMounted(fetchCardTypes)
</script>

<style scoped lang="scss">
.knowledge-recall-test {
  --knowledge-recall-top-k-color: #0ea5e9;
}

.knowledge-recall-test__header {
  min-height: 5.5rem;
  padding: 1.25rem;
  overflow: visible;
}

.knowledge-recall-test__form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
}

@media (min-width: 720px) {
  .knowledge-recall-test__form-grid {
    grid-template-columns: minmax(0, 1fr) 320px;
  }
}

.knowledge-recall-test :deep(.knowledge-recall-test__top-k-slider .ant-slider-track) {
  background-color: var(--knowledge-recall-top-k-color);
}

.knowledge-recall-test :deep(.knowledge-recall-test__top-k-slider:hover .ant-slider-track) {
  background-color: var(--knowledge-recall-top-k-color);
}

.knowledge-recall-test :deep(.knowledge-recall-test__top-k-slider .ant-slider-handle::after) {
  box-shadow: 0 0 0 2px var(--knowledge-recall-top-k-color);
}

.knowledge-recall-test :deep(.knowledge-recall-test__top-k-slider:hover .ant-slider-handle::after) {
  box-shadow: 0 0 0 2px var(--knowledge-recall-top-k-color);
}
</style>
