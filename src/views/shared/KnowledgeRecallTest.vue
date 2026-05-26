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
          <a-button :loading="historyLoading" :disabled="loading" @click="openHistoryModal">
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
            <h2
              class="m-0 flex items-center gap-2 text-base font-semibold text-(--color-text-base)"
            >
              <MessageOutlined class="text-primary" />
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
            <h2
              class="m-0 flex items-center gap-2 text-base font-semibold text-(--color-text-base)"
            >
              <FileTextOutlined class="text-primary" />
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
                <a-tag color="blue">{{ formatScore(source.score) }}</a-tag>
                <span
                  class="inline-flex min-w-0 items-center gap-1.5 font-medium text-(--color-text-base)"
                >
                  <FileTextOutlined class="shrink-0 text-primary" />
                  <span class="truncate">{{ source.title }}</span>
                </span>
                <a-tag :color="getLocalizedCardTypeConfig(source.cardType).color">
                  {{ getLocalizedCardTypeConfig(source.cardType).label }}
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
      v-model:open="historyOpen"
      width="min(1080px, calc(100vw - 48px))"
      centered
      destroy-on-close
      :title="t('knowledge.recall.historyTitle')"
    >
      <div class="space-y-4">
        <PageFilter
          ref="historyFilterRef"
          class="knowledge-recall-history__filter"
          :filter-conf="historyFilterConf"
          :enable-layout-row-collapse="false"
          @fetch-table-data="handleHistorySearch"
        />

        <PageTable
          ref="historyTableRef"
          class="knowledge-recall-history__table"
          :table-conf="historyTableConf"
          :table-columns="historyTableColumns"
          :table-data="historyRows"
          @fetch-table-data="fetchHistory"
        />
      </div>

      <template #footer>
        <a-button @click="historyOpen = false">{{ t('common.close') }}</a-button>
      </template>
    </a-modal>

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
                <a-tag :color="getLocalizedCardTypeConfig(detailCardType).color" class="m-0">
                  {{ getLocalizedCardTypeConfig(detailCardType).label }}
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
              <a-alert
                v-if="detailUsesPreviewContent"
                class="mb-4"
                type="info"
                show-icon
                :message="t('knowledge.recall.previewContentFallbackHint')"
              />
              <!-- eslint-disable-next-line vue/no-v-html -- 召回详情返回的 md_content 为 Markdown，已通过 marked + DOMPurify 清洗 -->
              <div v-if="hasDetailMarkdown" v-html="detailMarkdownHtml" />
              <div v-else class="knowledge-recall-detail__empty">
                <a-empty :description="t('knowledge.recall.noCardContent')" />
              </div>
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
                <button
                  v-for="(file, index) in detailSourceFiles"
                  :key="file.id || file.name || file.file_name || `file-${index}`"
                  type="button"
                  class="knowledge-recall-detail__file-card"
                  :class="{
                    'knowledge-recall-detail__file-card--loading':
                      openingSourceFileKey === getSourceFileKey(file, index),
                  }"
                  :title="t('knowledge.openFilePreview')"
                  :aria-label="t('knowledge.openFilePreview')"
                  @click="handleOpenSourceFile(file, index)"
                  @keydown.enter.prevent="handleOpenSourceFile(file, index)"
                  @keydown.space.prevent="handleOpenSourceFile(file, index)"
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
                </button>
              </div>
              <div v-else class="knowledge-recall-detail__files-empty">
                <a-empty :description="t('knowledge.recall.noRelatedFiles')" />
              </div>
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
  HistoryOutlined,
  SearchOutlined,
  QuestionCircleOutlined,
  MessageOutlined,
} from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import PageFilter from '@/components/PageFilter/index.vue'
import type { PageFilterConfig } from '@/components/PageFilter/types'
import PageTable from '@/components/PageTable/index.vue'
import type { PageTableColumnConfig, PageTableConfig } from '@/components/PageTable/types'
import { getCardTypes } from '@/api/knowledge'
import {
  getKnowledgeRecallHistory,
  getKnowledgeRecallSessionDetail,
  recallKnowledgeCards,
} from '@/api/knowledgeRecall'
import { getFileListItemById } from '@/api/knowledge'
import type { CardType, CardTypeOption, FileListItem, FileSource } from '@/types/knowledge'
import { getCardTypeConfig, getCardTypeOptionLabel, getFileOriginalUrl } from '@/types/knowledge'
import type {
  KnowledgeRecallOwnerType,
  KnowledgeRecallSessionItem,
  KnowledgeRecallViewModel,
  KnowledgeRecallViewSource,
} from '@/types/knowledgeRecall'
import { renderMarkdownSafe } from '@/utils/renderMarkdownSafe'
import { formatFileSize } from '@/utils/formatFileSize'
import { openFilePreview } from '@/utils/fileType'
import { stashKnowledgePreviewFile } from '@/utils/knowledgePreviewStash'
import {
  ALL_RECALL_CARD_TYPES_VALUE,
  formatRecallHistoryCreatedAt,
  formatRecallHistoryLatency,
  normalizeKnowledgeRecallResult,
  normalizeKnowledgeRecallSessionDetail,
  resolveRecallCardTypeSelection,
} from '@/utils/knowledgeRecall'
import 'github-markdown-css/github-markdown-light.css'

const CARD_TYPES_CACHE_KEY = 'knowledge-recall-card-types'

const props = defineProps<{
  ownerType: KnowledgeRecallOwnerType
  ownerId: string
}>()

const { t } = useI18n()
const router = useRouter()
const getLocalizedCardTypeConfig = (type: string) => getCardTypeConfig(type, (key) => t(key))

const PREVIEW_ROUTE_NAMES: Record<KnowledgeRecallOwnerType, string> = {
  personal: 'MyFilesPreview',
  dept: 'DeptFilesPreview',
  org: 'OrgFilesPreview',
}

const query = ref('')
const topK = ref(5)
const selectedAllCardTypes = ref(true)
const selectedCardTypes = ref<CardType[]>([])
const cardTypes = ref<CardTypeOption[]>([])
const cardTypesLoading = ref(false)
const loading = ref(false)
const result = ref<KnowledgeRecallViewModel | null>(null)
const detailOpen = ref(false)
const selectedSource = ref<KnowledgeRecallViewSource | null>(null)
const historyOpen = ref(false)
const historyLoading = ref(false)
const historyDetailLoading = ref(false)
const openingSourceFileKey = ref<string | null>(null)
const historyRows = ref<KnowledgeRecallSessionItem[]>([])
const historyTotal = ref(0)
const historyFilterRef = ref<InstanceType<typeof PageFilter> | null>(null)
const historyTableRef = ref<InstanceType<typeof PageTable> | null>(null)

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
const detailCardId = computed(() => selectedSource.value?.cardId || '-')
const detailCardType = computed(() => selectedSource.value?.cardType || 'rule')
const detailUpdatedAt = computed(() => {
  const raw = selectedSource.value?.updatedAt
  if (!raw) return '-'
  const value = dayjs(raw)
  return value.isValid() ? value.format('YYYY-MM-DD HH:mm:ss') : raw
})
const detailMarkdown = computed(() => selectedSource.value?.mdContent ?? '')
const hasDetailMarkdown = computed(() => detailMarkdown.value.trim() !== '')
const detailMarkdownHtml = computed(() => renderMarkdownSafe(detailMarkdown.value))
const detailUsesPreviewContent = computed(
  () => selectedSource.value?.previewContentFallback === true
)
const selectedRecallScore = computed(() => {
  const raw = selectedSource.value?.score
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : 0
})
const selectedRecallScoreText = computed(() => selectedRecallScore.value.toFixed(2))
const selectedRecallScorePercent = computed(() => {
  const value = Math.min(1, Math.max(0, selectedRecallScore.value))
  return `${Math.round(value * 100)}%`
})
const detailSourceFiles = computed<FileSource[]>(() => selectedSource.value?.sourceFiles ?? [])
const queryTimeText = computed(() => {
  const value = result.value?.queryTimeMs
  if (typeof value !== 'number' || !Number.isFinite(value)) return ''
  return t('knowledge.recall.queryTime', { time: `${Math.round(value)}ms` })
})
const confidenceText = computed(() => {
  const value = result.value?.confidence
  if (typeof value !== 'number' || !Number.isFinite(value)) return ''
  return t('knowledge.recall.confidence', { value: `${Math.round(value * 100)}%` })
})
const historyStatusOptions = computed(() => [
  { label: t('knowledge.recall.statusSuccess'), value: 'success' },
  { label: t('knowledge.recall.statusFailed'), value: 'failed' },
  { label: t('knowledge.recall.statusTimeout'), value: 'timeout' },
  { label: t('knowledge.recall.statusError'), value: 'error' },
])
const historyCardTypeOptions = computed(() =>
  cardTypes.value.map((item) => ({
    label: getCardTypeOptionLabel(item, (key) => t(key)),
    value: item.code,
  }))
)
const historyFilterConf = computed<PageFilterConfig>(() => ({
  filterForm: [
    {
      key: 'card_type',
      label: t('knowledge.recall.cardTypeLabel'),
      type: 'select',
      ph: t('knowledge.recall.allTypes'),
      col: 7,
      options: historyCardTypeOptions.value,
      clearable: true,
    },
    {
      key: 'recall_status',
      label: t('knowledge.recall.statusLabel'),
      type: 'select',
      ph: t('common.all'),
      col: 5,
      options: historyStatusOptions.value,
      clearable: true,
    },
  ],
  btns: [
    {
      text: t('common.search'),
      type: 'primary',
      icon: SearchOutlined,
      handle: handleHistorySearch,
    },
  ],
  btnsCol: 4,
}))
const historyTableConf = computed<PageTableConfig>(() => ({
  isLoading: historyLoading.value || historyDetailLoading.value,
  total: historyTotal.value,
  rowKey: 'id',
  hideTableBar: true,
  paginationSizes: [10, 20, 50],
  tableHeight: 560,
  tableMinHeight: '360px',
}))
const historyTableColumns = computed<PageTableColumnConfig[]>(() => [
  {
    label: t('knowledge.recall.queryColumn'),
    prop: 'query',
    showOverflowTooltip: true,
    resizable: true,
    width: 260,
  },
  {
    label: t('knowledge.recall.cardTypeLabel'),
    prop: 'card_type',
    formatter: (row) => formatHistoryCardType(row.card_type as CardType | null | undefined),
    resizable: true,
    width: 150,
  },
  { label: 'Top-K', prop: 'topk', width: 90, align: 'center' },
  {
    label: t('knowledge.recall.cardCount'),
    prop: 'card_count',
    align: 'center',
    width: 100,
  },
  {
    label: t('knowledge.recall.statusLabel'),
    prop: 'recall_status',
    type: 'scope',
    scopeType: '_tag',
    tagType: (row) => getHistoryStatusColor(row.recall_status as string | null | undefined),
    tagText: (row) => formatHistoryStatus(row.recall_status as string | null | undefined),
    width: 110,
  },
  {
    label: t('knowledge.recall.latency'),
    prop: 'latency',
    formatter: (row) => formatRecallHistoryLatency(row.latency as number | null | undefined),
    width: 110,
  },
  {
    label: t('common.createdAt'),
    prop: 'created_at',
    formatter: (row) => formatRecallHistoryCreatedAt(row.created_at as string | null | undefined),
    width: 150,
  },
  {
    label: t('common.actions'),
    type: 'operation',
    width: 90,
    fixed: 'right',
    btns: [
      {
        text: t('common.detail'),
        btnDisabled: (row) => !canViewHistoryDetail(row),
        handle: (row) => handleSelectHistory(row as unknown as KnowledgeRecallSessionItem),
      },
    ],
  },
])

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

async function fetchHistory() {
  if (!props.ownerId) return
  historyLoading.value = true
  try {
    const filterParams = historyFilterRef.value?.filteParams ?? {}
    const page = Number(historyTableRef.value?.currentPage ?? 1)
    const pageSize = Number(historyTableRef.value?.pageSize ?? 10)
    const data = await getKnowledgeRecallHistory(props.ownerType, props.ownerId, {
      card_type: filterParams.card_type as CardType | undefined,
      recall_status: filterParams.recall_status as string | undefined,
      page,
      page_size: pageSize,
    })
    historyRows.value = data.items
    historyTotal.value = data.total
  } finally {
    historyLoading.value = false
  }
}

function openHistoryModal() {
  if (loading.value) return
  historyOpen.value = true
  fetchHistory()
}

function handleHistorySearch() {
  historyTableRef.value?.resetCurPage()
  fetchHistory()
}

async function handleSelectHistory(row: KnowledgeRecallSessionItem) {
  historyDetailLoading.value = true
  try {
    const detail = await getKnowledgeRecallSessionDetail(row.id)
    const view = normalizeKnowledgeRecallSessionDetail(detail)
    result.value = view
    query.value = view.query
    topK.value = view.topK ?? 5
    if (view.cardType) {
      selectedAllCardTypes.value = false
      selectedCardTypes.value = [view.cardType]
    } else {
      selectedAllCardTypes.value = true
      selectedCardTypes.value = [...availableCardTypes.value]
    }
    selectedSource.value = null
    detailOpen.value = false
    historyOpen.value = false
  } finally {
    historyDetailLoading.value = false
  }
}

function handleOpenSourceDetail(source: KnowledgeRecallViewSource) {
  selectedSource.value = source
  detailOpen.value = true
}

function handleCloseDetail() {
  detailOpen.value = false
}

function formatHistoryCardType(type: CardType | null | undefined) {
  if (!type) return '-'
  return getLocalizedCardTypeConfig(type).label
}

function formatHistoryStatus(status: string | null | undefined) {
  const labels: Record<string, string> = {
    success: t('knowledge.recall.statusSuccess'),
    failed: t('knowledge.recall.statusFailed'),
    timeout: t('knowledge.recall.statusTimeout'),
    error: t('knowledge.recall.statusError'),
  }
  return status ? (labels[status] ?? status) : '-'
}

function getHistoryStatusColor(status: string | null | undefined) {
  const colors: Record<string, string> = {
    success: 'success',
    failed: 'error',
    timeout: 'warning',
    error: 'error',
  }
  return status ? (colors[status] ?? 'default') : 'default'
}

function canViewHistoryDetail(row: Record<string, unknown>) {
  return row.recall_status === 'success'
}

function formatScore(score: number | null) {
  if (typeof score !== 'number' || !Number.isFinite(score)) return '-'
  return score.toFixed(2)
}

function getSourceFileName(file: FileSource) {
  return file.name || file.file_name || file.id || '-'
}

function getSourceFileKey(file: FileSource, index: number) {
  return (
    file.id || file.storage_url || file.parsed_file_url || file.name || file.file_name || `${index}`
  )
}

function getSourceFilePreviewUrl(file: FileSource) {
  return file.parsed_file_url || file.storage_url || ''
}

function buildFallbackFileListItem(file: FileSource): FileListItem {
  return {
    id: file.id || getSourceFilePreviewUrl(file) || getSourceFileName(file),
    file_name: getSourceFileName(file),
    file_type: file.file_type ?? '',
    file_size: file.file_size ?? 0,
    dir_id: '',
    dir_name: '',
    status: 'done',
    storage_url: file.storage_url ?? null,
    parsed_file_url: file.parsed_file_url ?? null,
    error_msg: null,
    auto_category_suggestion: null,
    auto_category_name: null,
    knowledge_card_count: 0,
    created_by: '',
    created_by_name: '',
    created_at: '',
    updated_at: '',
  }
}

function openSourceFileByUrl(file: FileSource) {
  const url = getSourceFilePreviewUrl(file)
  if (!url) return false
  openFilePreview(url, getSourceFileName(file))
  return true
}

async function handleOpenSourceFile(file: FileSource, index: number) {
  const key = getSourceFileKey(file, index)
  if (openingSourceFileKey.value === key) return

  openingSourceFileKey.value = key
  try {
    if (file.id) {
      const routeName = PREVIEW_ROUTE_NAMES[props.ownerType]
      if (routeName) {
        let fileItem: FileListItem | null = null
        try {
          fileItem = await getFileListItemById(props.ownerType, props.ownerId, file.id)
        } catch {
          fileItem = null
        }
        const previewFile = fileItem ?? buildFallbackFileListItem(file)
        if (getFileOriginalUrl(previewFile) || previewFile.parsed_file_url) {
          stashKnowledgePreviewFile(previewFile, {
            ownerType: props.ownerType,
            ownerId: props.ownerId,
          })
          handleCloseDetail()
          router.push({
            name: routeName,
            params: { id: previewFile.id },
          })
          return
        }
      }
    }

    if (openSourceFileByUrl(file)) return
    message.warning(file.id ? t('knowledge.previewNoUrlHint') : t('knowledge.missingFileId'))
  } finally {
    openingSourceFileKey.value = null
  }
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

.knowledge-recall-history__filter {
  margin-top: 0;
}

.knowledge-recall-history__table {
  padding: 0;
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
  padding: 1.5rem 1.75rem;
  overflow: hidden;
}

.knowledge-recall-detail__markdown {
  max-height: min(620px, calc(100vh - 280px));
  overflow-y: auto;
  overflow-wrap: break-word;
  background: transparent;
  color: var(--color-text-base);
  font-size: 14px;
  line-height: 1.75;
}

.knowledge-recall-detail__markdown :deep(h1),
.knowledge-recall-detail__markdown :deep(h2),
.knowledge-recall-detail__markdown :deep(h3) {
  color: var(--color-text-base);
}

.knowledge-recall-detail__markdown :deep(h1:first-child) {
  margin-top: 0;
}

.knowledge-recall-detail__markdown :deep(p:last-child),
.knowledge-recall-detail__markdown :deep(ul:last-child),
.knowledge-recall-detail__markdown :deep(ol:last-child) {
  margin-bottom: 0;
}

.knowledge-recall-detail__markdown :deep(pre) {
  overflow: auto;
}

.knowledge-recall-detail__empty {
  display: flex;
  min-height: min(620px, calc(100vh - 280px));
  align-items: center;
  justify-content: center;
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

.knowledge-recall-detail__file-card {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  background: #fff;
  padding: 0.75rem;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.knowledge-recall-detail__file-card:hover,
.knowledge-recall-detail__file-card:focus-visible {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgb(14 165 233 / 12%);
  outline: 0;
}

.knowledge-recall-detail__file-card--loading {
  cursor: progress;
  opacity: 0.72;
}

.dark .knowledge-recall-detail__file-card {
  background: rgb(15 23 42);
}

.knowledge-recall-detail__files-empty {
  display: flex;
  min-height: min(300px, calc(100vh - 520px));
  align-items: center;
  justify-content: center;
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
