<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue'
import type {
  KnowledgeCard,
  CardType,
  OnlineStatus,
  AuditStatus,
  OwnerType,
  CardTypeOption,
} from '@/types/knowledge'
import { ONLINE_STATUS_CONFIG, AUDIT_STATUS_CONFIG, getCardTypeConfig } from '@/types/knowledge'
import KnowledgeCardEditor from '../KnowledgeCardEditor/index.vue'
import KnowledgeCardViewer from '../KnowledgeCardViewer/index.vue'
import PageHead from '@/components/PageHead/index.vue'
import PageFilter from '@/components/PageFilter/index.vue'
import PageTable from '@/components/PageTable/index.vue'
import {
  getKnowledgeCards,
  toggleKnowledgeCardStatus,
  deleteKnowledgeCard,
  getCardTypes,
} from '@/api/knowledge'
import { useFileRemoteSearch } from '@/composables/useFileRemoteSearch'
import type { PageHeadConfig } from '@/components/PageHead/types'
import type { PageFilterConfig } from '@/components/PageFilter/types'
import type { PageTableConfig, PageTableColumnConfig } from '@/components/PageTable/types'
import dayjs from 'dayjs'

const { t } = useI18n()

const props = defineProps<{
  ownerType: OwnerType
  ownerId: string
}>()

defineEmits<{
  (e: 'success'): void
}>()

const {
  options: sourceFileOptions,
  loading: sourceFileLoading,
  loadDefault: loadDefaultSourceFiles,
  search: handleSourceFileSearch,
} = useFileRemoteSearch(
  toRef(() => props.ownerType),
  toRef(() => props.ownerId)
)

const pageFilterRef = ref<InstanceType<typeof PageFilter> | null>(null)
const pageTableRef = ref<InstanceType<typeof PageTable> | null>(null)

const activeTab = ref<CardType | 'all'>('all')
const loading = ref(false)
const tableData = ref<KnowledgeCard[]>([])
const total = ref(0)
const cardTypes = ref<CardTypeOption[]>([])

const editorOpen = ref(false)
const editingCard = ref<KnowledgeCard | undefined>(undefined)
const viewerOpen = ref(false)
const viewingCardId = ref<string | null>(null)

const headConf = computed<PageHeadConfig>(() => ({
  title: t('knowledge.card.title'),
  btns: [
    {
      text: t('knowledge.card.create'),
      type: 'primary',
      icon: PlusOutlined,
      handle: handleCreate,
    },
  ],
  tabsOptions: [
    { label: t('common.all'), value: 'all' },
    ...cardTypes.value.map((ct) => ({ label: ct.name, value: ct.code })),
  ],
  defaultTab: activeTab.value,
  tabChangeHandle: (val) => {
    activeTab.value = val as CardType | 'all'
    handleSearch()
  },
}))

const filterConf = computed<PageFilterConfig>(() => ({
  filterForm: [
    {
      key: 'keyword',
      label: t('knowledge.card.searchLabel'),
      type: 'input',
      ph: t('knowledge.card.searchPlaceholder'),
      col: 8,
      icon: SearchOutlined,
    },
    {
      key: 'online_status',
      label: t('knowledge.card.onlineStatus'),
      type: 'select',
      ph: t('common.all'),
      col: 6,
      options: Object.entries(ONLINE_STATUS_CONFIG).map(([value, cfg]) => ({
        label: cfg.label,
        value,
      })),
      clearable: true,
    },
    {
      key: 'audit_status',
      label: t('knowledge.card.auditStatus'),
      type: 'select',
      ph: t('common.all'),
      col: 6,
      options: Object.entries(AUDIT_STATUS_CONFIG).map(([value, cfg]) => ({
        label: cfg.label,
        value,
      })),
      clearable: true,
    },
    {
      key: 'source_file_id',
      label: t('knowledge.card.sourceFileFilter'),
      type: 'slot',
      slotName: 'sourceFileFilter',
      col: 8,
    },
    {
      key: 'tag',
      label: t('knowledge.card.tagsLabel'),
      type: 'input',
      ph: t('knowledge.card.tagFilterPlaceholder'),
      col: 6,
    },
  ],
  btns: [
    {
      text: t('common.query'),
      type: 'primary',
      icon: SearchOutlined,
      handle: handleSearch,
    },
    {
      text: t('common.reset'),
      icon: ReloadOutlined,
      handle: () => {
        pageFilterRef.value?.filterFormReset()
        handleSearch()
      },
    },
  ],
  btnsCol: 4,
}))

const tableConf = computed<PageTableConfig>(() => ({
  isLoading: loading.value,
  total: total.value,
  updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  rowKey: 'id',
}))

const tableColumns = computed<PageTableColumnConfig[]>(() => [
  {
    label: t('knowledge.card.columnTitle'),
    prop: 'title',
    width: 250,
    type: 'slot',
    slotName: 'title',
  },
  {
    label: t('knowledge.card.columnType'),
    prop: 'type',
    width: 100,
    type: 'scope',
    scopeType: '_tag',
    tagType: (row) => getCardTypeConfig(row.type as string).color,
    tagText: (row) => getCardTypeConfig(row.type as string).label,
  },
  {
    label: t('knowledge.card.columnStatus'),
    prop: 'online_status',
    width: 120,
    type: 'scope',
    scopeType: '_tag',
    tagType: (row) => (row.online_status === 'online' ? 'success' : 'default'),
    tagText: (row) => ONLINE_STATUS_CONFIG[row.online_status as OnlineStatus].label,
  },
  {
    label: t('knowledge.card.columnAuditStatus'),
    prop: 'audit_status',
    width: 120,
    type: 'scope',
    scopeType: '_tag',
    tagType: (row) => AUDIT_STATUS_CONFIG[row.audit_status as AuditStatus].color,
    tagText: (row) => AUDIT_STATUS_CONFIG[row.audit_status as AuditStatus].label,
  },
  {
    label: t('knowledge.card.columnReferenceCount'),
    prop: 'reference_count',
    width: 100,
    align: 'center',
  },
  {
    label: t('knowledge.card.columnUpdatedAt'),
    prop: 'updated_at',
    width: 160,
    formatter: (row) => dayjs(row.updated_at as string).format('YYYY-MM-DD HH:mm'),
  },
  {
    label: t('common.actions'),
    type: 'operation',
    width: 240,
    fixed: 'right',
    btns: [
      {
        text: t('common.detail'),
        icon: EyeOutlined,
        handle: (row) => handleView(row as KnowledgeCard),
      },
      {
        text: t('common.edit'),
        icon: EditOutlined,
        handle: (row) => handleEdit(row as KnowledgeCard),
      },
      {
        text: t('knowledge.card.onlineToggle'),
        dynamicText: (row) =>
          row.online_status === 'online' ? t('knowledge.card.offline') : t('knowledge.card.online'),
        dynamicIcon: (row) =>
          row.online_status === 'online' ? CloudDownloadOutlined : CloudUploadOutlined,
        type: 'popconfirm',
        dynamicPopconfirmTitle: (row) =>
          row.online_status === 'online'
            ? t('knowledge.card.confirmToggleOffline')
            : t('knowledge.card.confirmToggleOnline'),
        handle: (row) => handleStatusToggle(row as KnowledgeCard),
      },
      {
        text: t('common.delete'),
        icon: DeleteOutlined,
        type: 'popconfirm',
        popconfirmTitle: t('knowledge.card.confirmDelete'),
        handle: (row) => handleDelete(row as KnowledgeCard),
      },
    ],
  },
])

function toOnlineStatus(v: unknown): OnlineStatus | undefined {
  return v === 'online' || v === 'offline' ? v : undefined
}

function toAuditStatus(v: unknown): AuditStatus | undefined {
  return v === 'pending' || v === 'approved' || v === 'rejected' ? v : undefined
}

const fetchData = async () => {
  const params = pageFilterRef.value?.filteParams ?? {}
  const page = pageTableRef.value?.currentPage ?? 1
  const pageSize = pageTableRef.value?.pageSize ?? 10

  loading.value = true
  try {
    const result = await getKnowledgeCards(props.ownerType, props.ownerId, {
      page,
      page_size: pageSize,
      type: activeTab.value !== 'all' ? activeTab.value : undefined,
      keyword: (params.keyword as string) || undefined,
      online_status: toOnlineStatus(params.online_status),
      audit_status: toAuditStatus(params.audit_status),
      source_file_id: (params.source_file_id as string) || undefined,
      tag: (params.tag as string) || undefined,
    })
    tableData.value = result.items
    total.value = result.total
  } catch (err) {
    console.error('Fetch failed:', err)
    message.error(t('knowledge.card.fetchFailed'))
  } finally {
    loading.value = false
  }
}

const fetchCardTypes = async () => {
  try {
    cardTypes.value = await getCardTypes()
  } catch (err) {
    console.error('Fetch card types failed:', err)
  }
}

const handleDelete = async (record: KnowledgeCard) => {
  try {
    await deleteKnowledgeCard(props.ownerType, props.ownerId, record.id)
    message.success(t('knowledge.card.deleteSuccess'))
    fetchData()
  } catch (err) {
    console.error('Delete card failed:', err)
    message.error(t('knowledge.card.deleteFailed'))
  }
}

onMounted(() => {
  fetchCardTypes()
  fetchData()
  loadDefaultSourceFiles()
})

const handleSearch = () => {
  pageTableRef.value?.resetCurPage(1)
  fetchData()
}

const handleCreate = () => {
  editingCard.value = undefined
  editorOpen.value = true
}

const handleEdit = (record: KnowledgeCard) => {
  editingCard.value = record
  editorOpen.value = true
}

const handleEditFromViewer = (record: KnowledgeCard) => {
  editingCard.value = record
  editorOpen.value = true
}

const handleView = (record: KnowledgeCard) => {
  viewingCardId.value = record.id
  viewerOpen.value = true
}

function patchTableRowOnlineStatus(id: string, online_status: OnlineStatus) {
  const row = tableData.value.find((r) => r.id === id)
  if (row) {
    row.online_status = online_status
  }
}

const handleViewerStatusChanged = (payload: { id: string; online_status: OnlineStatus }) => {
  patchTableRowOnlineStatus(payload.id, payload.online_status)
}

const handleStatusToggle = async (record: KnowledgeCard) => {
  const newStatus = record.online_status === 'online' ? 'offline' : 'online'
  try {
    await toggleKnowledgeCardStatus(props.ownerType, props.ownerId, record.id, newStatus)
    message.success(
      newStatus === 'online'
        ? t('knowledge.card.onlineSuccess')
        : t('knowledge.card.offlineSuccess')
    )
    patchTableRowOnlineStatus(record.id, newStatus)
  } catch (err) {
    console.error('Status toggle failed:', err)
    message.error(t('common.error'))
  }
}
</script>

<template>
  <div class="knowledge-card-list flex flex-1 flex-col overflow-hidden">
    <div class="app-container p-4 mb-4">
      <PageHead :head-conf="headConf" />
      <PageFilter ref="pageFilterRef" :filter-conf="filterConf" @fetch-table-data="handleSearch">
        <template #sourceFileFilter="{ formData }">
          <a-select
            v-model:value="formData.source_file_id"
            show-search
            allow-clear
            :placeholder="t('knowledge.card.sourceFilePlaceholder')"
            :filter-option="false"
            :options="sourceFileOptions"
            :loading="sourceFileLoading"
            @search="handleSourceFileSearch"
            @change="handleSearch"
          />
        </template>
      </PageFilter>
    </div>

    <div class="app-container p-0 flex-1 flex flex-col min-h-0">
      <PageTable
        ref="pageTableRef"
        :table-conf="tableConf"
        :table-columns="tableColumns"
        :table-data="tableData"
        @fetch-table-data="fetchData"
      >
        <template #title="{ row }">
          <div class="flex flex-col">
            <span class="font-medium text-gray-800">{{ (row as KnowledgeCard).title }}</span>
            <div class="flex flex-wrap gap-1 mt-1">
              <a-tag v-for="tag in (row as KnowledgeCard).tags" :key="tag" size="small">
                {{ tag }}
              </a-tag>
            </div>
          </div>
        </template>
      </PageTable>
    </div>

    <KnowledgeCardEditor
      v-model:open="editorOpen"
      :card="editingCard"
      :owner-type="ownerType"
      :owner-id="ownerId"
      :card-types="cardTypes"
      @success="fetchData"
    />

    <KnowledgeCardViewer
      v-model:open="viewerOpen"
      :card-id="viewingCardId"
      :owner-type="ownerType"
      :owner-id="ownerId"
      @status-changed="handleViewerStatusChanged"
      @edit="handleEditFromViewer"
      @deleted="fetchData"
    />
  </div>
</template>
