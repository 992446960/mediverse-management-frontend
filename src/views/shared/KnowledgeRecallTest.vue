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
          <h2 class="m-0 text-base font-semibold text-(--color-text-base)">
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

    <div
      class="knowledge-recall-test__results relative rounded-md bg-white p-5 dark:bg-[--color-bg-container]"
      :class="{ 'knowledge-recall-test__results--placeholder': !result }"
    >
      <div
        v-if="loading"
        class="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-white/80 dark:bg-[--color-bg-container]/80"
        role="status"
        :aria-label="t('knowledge.recall.loading')"
      >
        <a-spin :spinning="true" :tip="t('knowledge.recall.loading')">
          <div class="min-h-[120px] min-w-[160px]" aria-hidden="true" />
        </a-spin>
      </div>

      <div v-if="!result && !loading" class="flex items-center justify-center">
        <a-empty :description="t('knowledge.recall.emptyResult')" />
      </div>

      <div v-else-if="result" class="space-y-4">
        <section
          class="rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 class="m-0 text-base font-semibold text-(--color-text-base)">
              {{ t('knowledge.recall.finalAnswer') }}
            </h2>
            <div class="flex flex-wrap gap-2 text-xs text-(--color-text-tertiary)">
              <a-tag v-if="queryTimeText">{{ queryTimeText }}</a-tag>
              <a-tag v-if="confidenceText">{{ confidenceText }}</a-tag>
            </div>
          </div>
          <div
            class="knowledge-recall-test__answer-body markdown-body prose prose-sm max-w-none dark:prose-invert"
          >
            <!-- eslint-disable-next-line vue/no-v-html -- 召回 answer 为 Markdown 文本，已通过 marked + DOMPurify 清洗 -->
            <div v-if="hasFinalAnswer" v-html="finalAnswerHtml" />
            <span v-else>{{ t('knowledge.recall.noAnswer') }}</span>
          </div>
        </section>

        <section
          class="rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 class="m-0 text-base font-semibold text-(--color-text-base)">
              {{ t('knowledge.recall.retrievedSources') }}
            </h2>
            <span class="text-sm text-(--color-text-secondary)">
              {{ t('knowledge.recall.sourceCount', { count: sourceCount }) }}
            </span>
          </div>

          <a-empty
            v-if="result.sources.length === 0"
            :description="t('knowledge.recall.noSources')"
          />
          <div v-else class="space-y-3">
            <article
              v-for="source in result.sources"
              :key="source.id"
              class="rounded-md border border-slate-200 p-3 dark:border-slate-800"
            >
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <a-tag color="blue">{{ formatScore(source.relevance_score) }}</a-tag>
                <span class="font-medium text-(--color-text-base)">{{ source.title }}</span>
                <a-tag :color="getCardTypeConfig(source.card_type).color">
                  {{ getCardTypeConfig(source.card_type).label }}
                </a-tag>
              </div>
              <p class="m-0 text-sm leading-6 text-(--color-text-secondary)">
                {{ source.excerpt }}
              </p>
            </article>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  FilterOutlined,
  CaretRightOutlined,
  UndoOutlined,
} from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import { getCardTypes } from '@/api/knowledge'
import { recallKnowledgeCards } from '@/api/knowledgeRecall'
import type { CardType, CardTypeOption } from '@/types/knowledge'
import { getCardTypeConfig } from '@/types/knowledge'
import type { KnowledgeRecallOwnerType, KnowledgeRecallResult } from '@/types/knowledgeRecall'
import { renderMarkdownSafe } from '@/utils/renderMarkdownSafe'
import {
  ALL_RECALL_CARD_TYPES_VALUE,
  resolveRecallCardTypeSelection,
} from '@/utils/knowledgeRecall'

const CARD_TYPES_CACHE_KEY = 'knowledge-recall-card-types'

const props = defineProps<{
  ownerType: KnowledgeRecallOwnerType
  ownerId: string
}>()

const { t } = useI18n()
const router = useRouter()

const query = ref('')
const topK = ref(5)
const selectedAllCardTypes = ref(true)
const selectedCardTypes = ref<CardType[]>([])
const cardTypes = ref<CardTypeOption[]>([])
const cardTypesLoading = ref(false)
const loading = ref(false)
const result = ref<KnowledgeRecallResult | null>(null)

const availableCardTypes = computed(() => cardTypes.value.map((item) => item.code))
const normalizedTopK = computed(() => Math.min(20, Math.max(1, Number(topK.value) || 5)))
const hasSelectedCardType = computed(
  () => selectedAllCardTypes.value || selectedCardTypes.value.length > 0
)
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
const sourceCount = computed(() => result.value?.count ?? result.value?.sources.length ?? 0)
const hasFinalAnswer = computed(() => (result.value?.answer ?? '').trim() !== '')
const finalAnswerHtml = computed(() => renderMarkdownSafe(result.value?.answer))
const queryTimeText = computed(() => {
  const value = result.value?.query_time_ms
  if (typeof value !== 'number' || !Number.isFinite(value)) return ''
  return t('knowledge.recall.queryTime', { time: `${Math.round(value)}ms` })
})
const confidenceText = computed(() => {
  const value = result.value?.confidence
  if (typeof value !== 'number' || !Number.isFinite(value)) return ''
  return t('knowledge.recall.confidence', { value: `${Math.round(value * 100)}%` })
})

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

function syncAllCardTypesSelection() {
  if (!selectedAllCardTypes.value) return
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

function handleReset() {
  query.value = ''
  topK.value = 5
  selectedAllCardTypes.value = true
  selectedCardTypes.value = [...availableCardTypes.value]
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
    result.value = await recallKnowledgeCards(props.ownerType, props.ownerId, {
      query: text,
      topK: normalizedTopK.value,
      cardTypes: selectedCardTypes.value,
      availableCardTypes: availableCardTypes.value,
    })
  } catch {
    result.value = null
  } finally {
    loading.value = false
  }
}

function formatScore(score: number) {
  if (!Number.isFinite(score)) return '-'
  return score.toFixed(2)
}

onMounted(fetchCardTypes)
</script>

<style scoped>
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

.knowledge-recall-test__answer-body {
  max-height: min(420px, calc(100vh - 360px));
  overflow-y: auto;
  overflow-wrap: break-word;
  color: var(--color-text-base);
  line-height: 1.7;
}

.knowledge-recall-test__answer-body :deep(p:last-child),
.knowledge-recall-test__answer-body :deep(ul:last-child),
.knowledge-recall-test__answer-body :deep(ol:last-child) {
  margin-bottom: 0;
}

.knowledge-recall-test__answer-body :deep(pre) {
  overflow: auto;
}

/* loading 遮罩为 absolute，不占文档流；无结果时外层需 min-height 才能居中且不被压扁 */
.knowledge-recall-test__results--placeholder {
  min-height: 240px;
}
</style>
