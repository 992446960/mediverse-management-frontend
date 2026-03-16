<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
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
} from '@/types/knowledge'
import { CARD_TYPE_CONFIG, ONLINE_STATUS_CONFIG, AUDIT_STATUS_CONFIG } from '@/types/knowledge'
import KnowledgeCardEditor from '../KnowledgeCardEditor/index.vue'
import KnowledgeCardViewer from '../KnowledgeCardViewer/index.vue'
import PageHead from '@/components/PageHead/index.vue'
import PageFilter from '@/components/PageFilter/index.vue'
import PageTable from '@/components/PageTable/index.vue'
import { getKnowledgeCards, toggleKnowledgeCardStatus } from '@/api/knowledge'
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

const pageFilterRef = ref<InstanceType<typeof PageFilter> | null>(null)
const pageTableRef = ref<InstanceType<typeof PageTable> | null>(null)

const activeTab = ref<CardType | 'all'>('all')
const loading = ref(false)
const tableData = ref<KnowledgeCard[]>([])
const total = ref(0)

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
    { label: t('knowledge.card.typeEvidence'), value: 'evidence' },
    { label: t('knowledge.card.typeRule'), value: 'rule' },
    { label: t('knowledge.card.typeExperience'), value: 'experience' },
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
    tagType: (row) => CARD_TYPE_CONFIG[row.type as CardType].color,
    tagText: (row) => CARD_TYPE_CONFIG[row.type as CardType].label,
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
    ],
  },
])

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
      online_status: (params.online_status as string) || undefined,
      audit_status: (params.audit_status as string) || undefined,
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

onMounted(fetchData)

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

const handleView = (record: KnowledgeCard) => {
  viewingCardId.value = record.id
  viewerOpen.value = true
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
    fetchData()
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
      <PageFilter ref="pageFilterRef" :filter-conf="filterConf" @fetch-table-data="handleSearch" />
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
              <Tag v-for="tag in (row as KnowledgeCard).tags" :key="tag" size="small">
                {{ tag }}
              </Tag>
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
      @success="fetchData"
    />

    <KnowledgeCardViewer
      v-model:open="viewerOpen"
      :card-id="viewingCardId"
      :owner-type="ownerType"
      :owner-id="ownerId"
      @rollback-success="fetchData"
    />
  </div>
</template>
