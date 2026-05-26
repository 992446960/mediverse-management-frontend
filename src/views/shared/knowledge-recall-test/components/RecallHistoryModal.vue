<template>
  <a-modal
    v-model:open="modelOpen"
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
      <a-button @click="modelOpen = false">{{ t('common.close') }}</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { SearchOutlined } from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import PageFilter from '@/components/PageFilter/index.vue'
import type { PageFilterConfig } from '@/components/PageFilter/types'
import PageTable from '@/components/PageTable/index.vue'
import type { PageTableColumnConfig, PageTableConfig } from '@/components/PageTable/types'
import { getKnowledgeRecallHistory, getKnowledgeRecallSessionDetail } from '@/api/knowledgeRecall'
import type { CardType, CardTypeOption } from '@/types/knowledge'
import { getCardTypeConfig, getCardTypeOptionLabel } from '@/types/knowledge'
import type {
  KnowledgeRecallOwnerType,
  KnowledgeRecallSessionItem,
  KnowledgeRecallViewModel,
} from '@/types/knowledgeRecall'
import {
  formatRecallConfidence,
  formatRecallHistoryCreatedAt,
  formatRecallHistoryLatency,
  normalizeKnowledgeRecallSessionDetail,
} from '@/utils/knowledgeRecall'

const props = defineProps<{
  open: boolean
  ownerType: KnowledgeRecallOwnerType
  ownerId: string
  cardTypes: CardTypeOption[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  select: [view: KnowledgeRecallViewModel]
}>()

const { t } = useI18n()
const getLocalizedCardTypeConfig = (type: string) => getCardTypeConfig(type, (key) => t(key))

const modelOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})
const historyLoading = ref(false)
const historyDetailLoading = ref(false)
const historyRows = ref<KnowledgeRecallSessionItem[]>([])
const historyTotal = ref(0)
const historyFilterRef = ref<InstanceType<typeof PageFilter> | null>(null)
const historyTableRef = ref<InstanceType<typeof PageTable> | null>(null)

const historyStatusOptions = computed(() => [
  { label: t('knowledge.recall.statusSuccess'), value: 'success' },
  { label: t('knowledge.recall.statusFailed'), value: 'failed' },
  { label: t('knowledge.recall.statusTimeout'), value: 'timeout' },
  { label: t('knowledge.recall.statusError'), value: 'error' },
])
const historyCardTypeOptions = computed(() =>
  props.cardTypes.map((item) => ({
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
    label: t('knowledge.recall.confidenceLabel'),
    prop: 'confidence',
    formatter: (row) => formatRecallConfidence(row.confidence as number | null | undefined),
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

function handleHistorySearch() {
  historyTableRef.value?.resetCurPage()
  fetchHistory()
}

async function handleSelectHistory(row: KnowledgeRecallSessionItem) {
  historyDetailLoading.value = true
  try {
    const detail = await getKnowledgeRecallSessionDetail(row.id)
    emit('select', normalizeKnowledgeRecallSessionDetail(detail))
    modelOpen.value = false
  } finally {
    historyDetailLoading.value = false
  }
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

watch(
  () => props.open,
  (open) => {
    if (open) fetchHistory()
  }
)
</script>

<style scoped lang="scss">
.knowledge-recall-history__filter {
  margin-top: 0;
}

.knowledge-recall-history__table {
  padding: 0;
}
</style>
