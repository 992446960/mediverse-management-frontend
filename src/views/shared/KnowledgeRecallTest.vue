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
          <div v-else class="knowledge-recall-test__sources-list space-y-3">
            <article
              v-for="source in result.sources"
              :key="source.id"
              class="cursor-pointer rounded-md border border-slate-200 p-3 transition-colors hover:border-primary hover:bg-(--ant-color-fill-tertiary) dark:border-slate-800"
              role="button"
              tabindex="0"
              :aria-label="`${t('knowledge.recall.viewCardDetail')}: ${source.title}`"
              @click="handleOpenSourceDetail(source)"
              @keydown.enter.prevent="handleOpenSourceDetail(source)"
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

    <a-modal
      v-model:open="detailOpen"
      width="min(980px, calc(100vw - 48px))"
      centered
      destroy-on-close
      wrap-class-name="knowledge-recall-detail-modal"
      :body-style="{ padding: 0 }"
    >
      <template #title>
        <div class="knowledge-recall-detail__title min-w-0">
          <div class="flex min-w-0 items-center gap-3">
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sky-50 text-primary dark:bg-sky-950"
            >
              <FileTextOutlined />
            </span>
            <div class="min-w-0">
              <h2 class="m-0 truncate text-lg font-semibold text-(--color-text-base)">
                {{ detailTitle }}
              </h2>
              <div
                class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-normal text-(--color-text-tertiary)"
              >
                <a-tag :color="getCardTypeConfig(detailCardType).color" class="m-0">
                  {{ getCardTypeConfig(detailCardType).label }}
                </a-tag>
                <span>ID: {{ detailCardId }}</span>
                <span>{{ t('common.updatedAt') }}: {{ detailUpdatedAt }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div class="knowledge-recall-detail">
        <div class="knowledge-recall-detail__body">
          <section class="knowledge-recall-detail__content">
            <div
              class="knowledge-recall-detail__markdown markdown-body prose prose-sm max-w-none dark:prose-invert"
            >
              <!-- eslint-disable-next-line vue/no-v-html -- 召回详情返回的 md_content 为 Markdown，已通过 marked + DOMPurify 清洗 -->
              <div v-if="hasDetailMarkdown" v-html="detailMarkdownHtml" />
              <a-empty v-else :description="t('knowledge.recall.noCardContent')" />
            </div>
          </section>

          <aside class="knowledge-recall-detail__aside">
            <section class="knowledge-recall-detail__panel">
              <div class="mb-3 flex items-center gap-2 text-sm font-semibold uppercase">
                <BarChartOutlined class="text-primary" />
                <span>{{ t('knowledge.recall.recallPerformance') }}</span>
              </div>
              <div class="rounded-md border border-(--color-border) bg-white p-4 dark:bg-slate-900">
                <div class="text-xs text-(--color-text-secondary)">
                  {{ t('knowledge.recall.recallScore') }}
                </div>
                <div class="mt-2 flex items-end gap-2">
                  <span class="text-3xl font-semibold leading-none text-primary">
                    {{ selectedRecallScoreText }}
                  </span>
                </div>
                <div class="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    class="h-full rounded-full bg-primary"
                    :style="{ width: selectedRecallScorePercent }"
                  />
                </div>
              </div>
            </section>

            <section class="knowledge-recall-detail__panel">
              <div class="mb-3 flex items-center gap-2 text-sm font-semibold">
                <LinkOutlined class="text-primary" />
                <span>{{ t('knowledge.recall.relatedFiles') }}</span>
              </div>
              <div v-if="detailSourceFiles.length" class="knowledge-recall-detail__files">
                <div
                  v-for="(file, index) in detailSourceFiles"
                  :key="file.id || file.name || file.file_name || `file-${index}`"
                  class="rounded-md border border-(--color-border) bg-white p-3 dark:bg-slate-900"
                >
                  <div class="flex min-w-0 items-start gap-2">
                    <FileTextOutlined class="mt-0.5 shrink-0 text-primary" />
                    <div class="min-w-0">
                      <div class="wrap-break-word text-sm font-medium text-(--color-text-base)">
                        {{ getSourceFileName(file) }}
                      </div>
                      <div class="mt-1 text-xs text-(--color-text-tertiary)">
                        {{ getSourceFileMeta(file) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <a-empty v-else :description="t('knowledge.recall.noRelatedFiles')" />
            </section>
          </aside>
        </div>
      </div>

      <template #footer>
        <a-button @click="handleCloseDetail">{{ t('common.close') }}</a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { message } from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  FilterOutlined,
  CaretRightOutlined,
  UndoOutlined,
  FileTextOutlined,
  BarChartOutlined,
  LinkOutlined,
} from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import { getCardTypes } from '@/api/knowledge'
import { recallKnowledgeCards } from '@/api/knowledgeRecall'
import type { CardType, CardTypeOption, FileSource } from '@/types/knowledge'
import { getCardTypeConfig } from '@/types/knowledge'
import type {
  KnowledgeRecallOwnerType,
  KnowledgeRecallResult,
  KnowledgeRecallSource,
} from '@/types/knowledgeRecall'
import { renderMarkdownSafe } from '@/utils/renderMarkdownSafe'
import { formatFileSize } from '@/utils/formatFileSize'
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
const detailOpen = ref(false)
const selectedSource = ref<KnowledgeRecallSource | null>(null)

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
const detailTitle = computed(() => selectedSource.value?.title || '-')
const detailCardId = computed(() => selectedSource.value?.id || '-')
const detailCardType = computed(() => selectedSource.value?.card_type || 'rule')
const detailUpdatedAt = computed(() => {
  const raw = selectedSource.value?.updated_at
  if (!raw) return '-'
  const value = dayjs(raw)
  return value.isValid() ? value.format('YYYY-MM-DD HH:mm:ss') : raw
})
const detailMarkdown = computed(() => selectedSource.value?.md_content ?? '')
const hasDetailMarkdown = computed(() => detailMarkdown.value.trim() !== '')
const detailMarkdownHtml = computed(() => renderMarkdownSafe(detailMarkdown.value))
const selectedRecallScore = computed(() => {
  const raw = selectedSource.value?.recall_score ?? selectedSource.value?.relevance_score
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : 0
})
const selectedRecallScoreText = computed(() => selectedRecallScore.value.toFixed(2))
const selectedRecallScorePercent = computed(() => {
  const value = Math.min(1, Math.max(0, selectedRecallScore.value))
  return `${Math.round(value * 100)}%`
})
const detailSourceFiles = computed<FileSource[]>(() => {
  return selectedSource.value?.source_files ?? selectedSource.value?.sources ?? []
})
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

function handleOpenSourceDetail(source: KnowledgeRecallSource) {
  selectedSource.value = source
  detailOpen.value = true
}

function handleCloseDetail() {
  detailOpen.value = false
}

function formatScore(score: number) {
  if (!Number.isFinite(score)) return '-'
  return score.toFixed(2)
}

function getSourceFileName(file: FileSource) {
  return file.name || file.file_name || file.id || '-'
}

function getSourceFileMeta(file: FileSource) {
  const parts: string[] = []
  if (typeof file.file_size === 'number' && file.file_size >= 0) {
    parts.push(formatFileSize(file.file_size))
  }
  if (file.page_hint) parts.push(file.page_hint)
  return parts.length > 0 ? parts.join(' · ') : '-'
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

.knowledge-recall-test__sources-list {
  max-height: min(520px, calc(100vh - 360px));
  overflow-y: auto;
  padding-right: 0.25rem;
  scrollbar-gutter: stable;
}

.knowledge-recall-detail {
  background: var(--color-bg-container);
}

.knowledge-recall-detail__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 288px;
  max-height: min(680px, calc(100vh - 220px));
  border-top: 1px solid var(--color-border);
}

.knowledge-recall-detail__content {
  min-width: 0;
  overflow: hidden;
}

.knowledge-recall-detail__markdown {
  max-height: min(620px, calc(100vh - 280px));
  overflow-y: auto;
  overflow-wrap: break-word;
  color: var(--color-text-base);
}

.knowledge-recall-detail__markdown :deep(p:last-child),
.knowledge-recall-detail__markdown :deep(ul:last-child),
.knowledge-recall-detail__markdown :deep(ol:last-child) {
  margin-bottom: 0;
}

.knowledge-recall-detail__markdown :deep(pre) {
  overflow: auto;
}

.knowledge-recall-detail__aside {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1.5rem;
  border-left: 1px solid var(--color-border);
  background: var(--color-bg-base);
  padding: 1.5rem;
}

.knowledge-recall-detail__files {
  display: flex;
  max-height: min(300px, calc(100vh - 520px));
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  padding-right: 0.25rem;
  scrollbar-gutter: stable;
}

@media (max-width: 900px) {
  .knowledge-recall-detail__body {
    grid-template-columns: minmax(0, 1fr);
  }

  .knowledge-recall-detail__aside {
    border-top: 1px solid var(--color-border);
    border-left: 0;
  }
}

/* loading 遮罩为 absolute，不占文档流；无结果时外层需 min-height 才能居中且不被压扁 */
.knowledge-recall-test__results--placeholder {
  min-height: 240px;
}
</style>
