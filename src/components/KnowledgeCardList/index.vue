<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { message, Modal } from 'ant-design-vue'
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined,
  DownOutlined,
} from '@ant-design/icons-vue'
import type {
  KnowledgeCard,
  CardType,
  OnlineStatus,
  AuditStatus,
  OwnerType,
  CardTypeOption,
} from '@/types/knowledge'
import {
  ONLINE_STATUS_CONFIG,
  AUDIT_STATUS_CONFIG,
  canOperateKnowledgeCard,
  canPublishKnowledgeCard,
  getAuditStatusConfig,
  getCardTypeConfig,
  getCardTypeOptionLabel,
  getOnlineStatusConfig,
} from '@/types/knowledge'
import KnowledgeCardEditor from '../KnowledgeCardEditor/index.vue'
import KnowledgeCardViewer from '../KnowledgeCardViewer/index.vue'
import KnowledgeCardStatusConfirmModal from '../KnowledgeCardStatusConfirmModal.vue'
import KnowledgeCardAuditModal from '../KnowledgeCardAuditModal.vue'
import PageHead from '@/components/PageHead/index.vue'
import PageFilter from '@/components/PageFilter/index.vue'
import PageTable from '@/components/PageTable/index.vue'
import {
  getKnowledgeCards,
  toggleKnowledgeCardStatus,
  deleteKnowledgeCard,
  batchDeleteKnowledgeCards,
  batchAuditKnowledgeCards,
  batchOnlineKnowledgeCards,
  batchOfflineKnowledgeCards,
  getCardTypes,
  auditKnowledgeCard,
} from '@/api/knowledge'
import { useFileRemoteSearch } from '@/composables/useFileRemoteSearch'
import type { PageHeadConfig } from '@/components/PageHead/types'
import type { PageFilterConfig } from '@/components/PageFilter/types'
import type { PageTableConfig, PageTableColumnConfig } from '@/components/PageTable/types'
import dayjs from 'dayjs'

const { t } = useI18n()
const router = useRouter()

const props = defineProps<{
  ownerType: OwnerType
  ownerId: string
}>()

type ToggleOnlineStatus = Extract<OnlineStatus, 'online' | 'offline'>

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
const statusConfirmOpen = ref(false)
const statusConfirmLoading = ref(false)
const statusConfirmCard = ref<KnowledgeCard | null>(null)
const statusConfirmTargetStatus = ref<ToggleOnlineStatus>('offline')
const auditModalOpen = ref(false)
const auditLoading = ref(false)
const auditCard = ref<KnowledgeCard | null>(null)
const auditAction = ref<'approved' | 'rejected'>('approved')
const batchAuditIds = ref<string[]>([])
const batchStatusIds = ref<string[]>([])

const translateKnowledgeConfig = (key: string) => t(key)
const cardTypeNameMap = computed(() => new Map(cardTypes.value.map((ct) => [ct.code, ct.name])))
const getLocalizedCardTypeConfig = (type: string) => {
  const config = getCardTypeConfig(type, translateKnowledgeConfig)
  if (config.label !== type) return config
  return {
    ...config,
    label: cardTypeNameMap.value.get(type) || type,
  }
}
const getLocalizedOnlineStatusConfig = (status: string) =>
  getOnlineStatusConfig(status, translateKnowledgeConfig)
const getLocalizedAuditStatusConfig = (status: AuditStatus) =>
  getAuditStatusConfig(status, translateKnowledgeConfig)

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
    ...cardTypes.value.map((ct) => ({
      label: getCardTypeOptionLabel(ct, translateKnowledgeConfig),
      value: ct.code,
    })),
  ],
  defaultTab: activeTab.value,
  tabChangeHandle: (val) => {
    activeTab.value = val as CardType | 'all'
    handleSearch()
  },
}))

const recallTestPath = computed(() => {
  const pathMap = {
    personal: '/my/knowledge-cards/recall-test',
    dept: '/dept/knowledge-cards/recall-test',
    org: '/org/knowledge-cards/recall-test',
    avatar: '/my/knowledge-cards/recall-test',
  } satisfies Record<OwnerType, string>

  return pathMap[props.ownerType]
})

function handleOpenRecallTest() {
  router.push(recallTestPath.value)
}

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
      options: Object.keys(ONLINE_STATUS_CONFIG).map((value) => ({
        label: getLocalizedOnlineStatusConfig(value).label,
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
      options: (Object.keys(AUDIT_STATUS_CONFIG) as AuditStatus[]).map((value) => ({
        label: getLocalizedAuditStatusConfig(value).label,
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
    label: t('common.selectionColumn'),
    type: 'selection',
    width: 60,
    fixed: 'left',
    selectDisabled: (row) => !canOperateKnowledgeCard((row as KnowledgeCard).online_status),
    configurable: { resizable: false },
  },
  {
    label: t('knowledge.card.columnTitle'),
    prop: 'title',
    width: 180,
    resizable: true,
    type: 'slot',
    slotName: 'title',
  },
  {
    label: t('knowledge.card.columnType'),
    prop: 'type',
    width: 200,
    resizable: true,
    type: 'scope',
    scopeType: '_tag',
    tagType: (row) => getLocalizedCardTypeConfig(row.type as string).color,
    tagText: (row) => getLocalizedCardTypeConfig(row.type as string).label,
  },
  {
    label: t('knowledge.card.columnStatus'),
    prop: 'online_status',
    width: 120,
    type: 'scope',
    scopeType: '_tag',
    tagType: (row) => getLocalizedOnlineStatusConfig(String(row.online_status)).color,
    tagText: (row) => getLocalizedOnlineStatusConfig(String(row.online_status)).label,
  },
  {
    label: t('knowledge.card.columnAuditStatus'),
    prop: 'audit_status',
    width: 120,
    type: 'scope',
    scopeType: '_tag',
    tagType: (row) => getLocalizedAuditStatusConfig(row.audit_status as AuditStatus).color,
    tagText: (row) => getLocalizedAuditStatusConfig(row.audit_status as AuditStatus).label,
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
    width: 260,
    fixed: 'right',
    btns: [
      {
        text: t('common.detail'),
        icon: EyeOutlined,
        btnDisabled: (row) => !canOperateKnowledgeCard(row.online_status as OnlineStatus),
        handle: (row) => handleView(row as KnowledgeCard),
      },
      {
        text: t('common.edit'),
        icon: EditOutlined,
        btnDisabled: (row) => !canOperateKnowledgeCard(row.online_status as OnlineStatus),
        handle: (row) => handleEdit(row as KnowledgeCard),
      },
      {
        text: t('knowledge.card.onlineToggle'),
        dynamicText: (row) =>
          row.online_status === 'online' ? t('knowledge.card.offline') : t('knowledge.card.online'),
        dynamicIcon: (row) =>
          row.online_status === 'online' ? CloudDownloadOutlined : CloudUploadOutlined,
        btnDisabled: (row) => !canOperateKnowledgeCard(row.online_status as OnlineStatus),
        handle: (row) => handleStatusToggle(row as KnowledgeCard),
      },
      {
        text: t('common.more'),
        type: 'popover',
        btnDisabled: (row) => !canOperateKnowledgeCard(row.online_status as OnlineStatus),
        moreList: [
          {
            text: t('knowledge.card.auditApprove'),
            icon: CheckOutlined,
            color: 'success',
            btnIsShow: (row) => row.audit_status === 'pending',
            btnDisabled: (row) => !canOperateKnowledgeCard(row.online_status as OnlineStatus),
            handle: (row) => handleAuditAction(row as KnowledgeCard, 'approved'),
          },
          {
            text: t('knowledge.card.auditReject'),
            icon: CloseOutlined,
            color: 'danger',
            btnIsShow: (row) => row.audit_status === 'pending',
            btnDisabled: (row) => !canOperateKnowledgeCard(row.online_status as OnlineStatus),
            handle: (row) => handleAuditAction(row as KnowledgeCard, 'rejected'),
          },
          {
            text: t('common.delete'),
            icon: DeleteOutlined,
            color: 'danger',
            type: 'popconfirm',
            popconfirmTitle: t('knowledge.card.confirmDelete'),
            btnDisabled: (row) => !canOperateKnowledgeCard(row.online_status as OnlineStatus),
            handle: (row) => handleDelete(row as KnowledgeCard),
          },
        ],
      },
    ],
  },
])

function toOnlineStatus(v: unknown): OnlineStatus | undefined {
  return v === 'online' || v === 'offline' || v === 'creating' || v === 'updating' ? v : undefined
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

const selectedCards = computed(
  () => (pageTableRef.value?.multipleSelection ?? []) as KnowledgeCard[]
)
const selectedCardIds = computed(() => selectedCards.value.map((item) => item.id))

function ensureBatchSelection() {
  if (selectedCardIds.value.length === 0) {
    message.warning(t('knowledge.card.batchNoSelection'))
    return false
  }
  if (selectedCards.value.some((card) => !canOperateKnowledgeCard(card.online_status))) {
    message.warning(t('knowledge.card.creatingBlocked'))
    return false
  }
  return true
}

function clearBatchSelection() {
  pageTableRef.value?.clearSelection()
}

function clearBatchAuditContext() {
  batchAuditIds.value = []
}

function openBatchAudit(action: 'approved' | 'rejected') {
  if (!ensureBatchSelection()) return
  batchAuditIds.value = [...selectedCardIds.value]
  auditCard.value = null
  auditAction.value = action
  auditModalOpen.value = true
}

function openBatchOnline() {
  if (!ensureBatchSelection()) return
  if (selectedCards.value.some((card) => !canPublishKnowledgeCard(card.audit_status))) {
    message.warning(t('knowledge.card.onlineBlockedByAudit'))
    return
  }
  batchStatusIds.value = [...selectedCardIds.value]
  statusConfirmCard.value = null
  statusConfirmTargetStatus.value = 'online'
  statusConfirmOpen.value = true
}

function openBatchOffline() {
  if (!ensureBatchSelection()) return
  batchStatusIds.value = [...selectedCardIds.value]
  statusConfirmCard.value = null
  statusConfirmTargetStatus.value = 'offline'
  statusConfirmOpen.value = true
}

function openBatchDelete() {
  if (!ensureBatchSelection()) return
  const ids = [...selectedCardIds.value]
  Modal.confirm({
    title: t('knowledge.card.batchDelete'),
    content: t('knowledge.card.batchDeleteConfirm', { count: ids.length }),
    okText: t('common.confirm'),
    cancelText: t('common.cancel'),
    okType: 'danger',
    onOk: async () => {
      const result = await batchDeleteKnowledgeCards(props.ownerType, props.ownerId, {
        card_ids: ids,
      })
      message.success(t('knowledge.card.batchDeleteSuccess', { count: result.deleted_count }))
      clearBatchSelection()
      await fetchData()
    },
  })
}

const handleDelete = async (record: KnowledgeCard) => {
  if (!canOperateKnowledgeCard(record.online_status)) {
    message.warning(t('knowledge.card.creatingBlocked'))
    return
  }
  try {
    await deleteKnowledgeCard(props.ownerType, props.ownerId, record.id)
    message.success(t('knowledge.card.deleteSuccess'))
    fetchData()
  } catch (err) {
    console.error('Delete card failed:', err)
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
  if (!canOperateKnowledgeCard(record.online_status)) {
    message.warning(t('knowledge.card.creatingBlocked'))
    return
  }
  editingCard.value = record
  editorOpen.value = true
}

const handleEditFromViewer = (record: KnowledgeCard) => {
  editingCard.value = record
  editorOpen.value = true
}

const handleView = (record: KnowledgeCard) => {
  if (!canOperateKnowledgeCard(record.online_status)) {
    message.warning(t('knowledge.card.creatingBlocked'))
    return
  }
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

const doStatusToggle = async (
  record: KnowledgeCard,
  newStatus: ToggleOnlineStatus,
  note?: string
) => {
  try {
    await toggleKnowledgeCardStatus(props.ownerType, props.ownerId, record.id, newStatus, note)
    message.success(
      newStatus === 'online'
        ? t('knowledge.card.onlineSuccess')
        : t('knowledge.card.offlineSuccess')
    )
    patchTableRowOnlineStatus(record.id, newStatus)
    return true
  } catch (err) {
    console.error('Status toggle failed:', err)
    return false
  }
}

const handleStatusToggle = (record: KnowledgeCard) => {
  if (!canOperateKnowledgeCard(record.online_status)) {
    message.warning(t('knowledge.card.creatingBlocked'))
    return
  }
  const newStatus = record.online_status === 'online' ? 'offline' : 'online'
  if (newStatus === 'online' && !canPublishKnowledgeCard(record.audit_status)) {
    message.warning(t('knowledge.card.onlineBlockedByAudit'))
    return
  }
  statusConfirmCard.value = record
  statusConfirmTargetStatus.value = newStatus
  statusConfirmOpen.value = true
}

const handleStatusConfirm = async (note?: string) => {
  if (!statusConfirmCard.value && batchStatusIds.value.length === 0) return
  statusConfirmLoading.value = true
  try {
    if (statusConfirmCard.value) {
      const ok = await doStatusToggle(
        statusConfirmCard.value,
        statusConfirmTargetStatus.value,
        statusConfirmTargetStatus.value === 'offline' ? note : undefined
      )
      if (ok) {
        statusConfirmOpen.value = false
        statusConfirmCard.value = null
      }
      return
    }

    const ids = [...batchStatusIds.value]
    if (statusConfirmTargetStatus.value === 'online') {
      const result = await batchOnlineKnowledgeCards(props.ownerType, props.ownerId, {
        card_ids: ids,
      })
      message.success(t('knowledge.card.batchOnlineSuccess', { count: result.updated_count }))
      ids.forEach((id) => patchTableRowOnlineStatus(id, 'online'))
    } else {
      const result = await batchOfflineKnowledgeCards(props.ownerType, props.ownerId, {
        card_ids: ids,
        note,
      })
      message.success(t('knowledge.card.batchOfflineSuccess', { count: result.updated_count }))
      ids.forEach((id) => patchTableRowOnlineStatus(id, 'offline'))
    }
    statusConfirmOpen.value = false
    batchStatusIds.value = []
    clearBatchSelection()
  } finally {
    statusConfirmLoading.value = false
  }
}

function patchTableRowAuditStatus(
  id: string,
  audit_status: AuditStatus,
  audit_reject_reason?: string
) {
  const row = tableData.value.find((r) => r.id === id)
  if (row) {
    row.audit_status = audit_status
    row.audit_reject_reason = audit_reject_reason ?? null
  }
}

const handleViewerAuditChanged = (payload: { id: string; audit_status: AuditStatus }) => {
  patchTableRowAuditStatus(payload.id, payload.audit_status)
}

const handleAuditAction = (record: KnowledgeCard, action: 'approved' | 'rejected') => {
  if (!canOperateKnowledgeCard(record.online_status)) {
    message.warning(t('knowledge.card.creatingBlocked'))
    return
  }
  clearBatchAuditContext()
  auditCard.value = record
  auditAction.value = action
  auditModalOpen.value = true
}

const handleAuditConfirm = async (reason?: string) => {
  if (!auditCard.value && batchAuditIds.value.length === 0) return
  auditLoading.value = true
  try {
    if (batchAuditIds.value.length > 0) {
      const ids = [...batchAuditIds.value]
      const result = await batchAuditKnowledgeCards(props.ownerType, props.ownerId, {
        card_ids: ids,
        audit_status: auditAction.value,
        audit_reject_reason: auditAction.value === 'rejected' ? reason : undefined,
      })
      message.success(
        t(
          auditAction.value === 'approved'
            ? 'knowledge.card.batchAuditApproveSuccess'
            : 'knowledge.card.batchAuditRejectSuccess',
          { count: result.updated_count }
        )
      )
      ids.forEach((id) =>
        patchTableRowAuditStatus(
          id,
          auditAction.value,
          auditAction.value === 'rejected' ? reason : undefined
        )
      )
      auditModalOpen.value = false
      clearBatchAuditContext()
      clearBatchSelection()
      return
    }

    if (!auditCard.value) return
    await auditKnowledgeCard(
      props.ownerType,
      props.ownerId,
      auditCard.value.id,
      auditAction.value,
      reason
    )
    message.success(t('knowledge.card.auditSuccess'))
    patchTableRowAuditStatus(
      auditCard.value.id,
      auditAction.value,
      auditAction.value === 'rejected' ? reason : undefined
    )
    auditModalOpen.value = false
    auditCard.value = null
  } catch (err) {
    console.error('Audit failed:', err)
  } finally {
    auditLoading.value = false
  }
}
</script>

<template>
  <div class="knowledge-card-list flex flex-1 flex-col overflow-hidden">
    <div class="app-container p-4 mb-4">
      <PageHead :head-conf="headConf">
        <a-button @click="handleOpenRecallTest">
          <template #icon>
            <SearchOutlined />
          </template>
          {{ t('knowledge.recall.entry') }}
        </a-button>
      </PageHead>
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
        <template v-if="selectedCardIds.length > 0" #toolbarExtra>
          <div class="knowledge-card-list__batch-toolbar">
            <span class="knowledge-card-list__batch-count">
              {{ t('knowledge.card.batchSelectedCount', { count: selectedCardIds.length }) }}
            </span>
            <a-button
              type="link"
              class="knowledge-card-list__batch-clear"
              @click="clearBatchSelection"
            >
              {{ t('common.clearSelection') }}
            </a-button>
            <a-button type="primary" @click="openBatchAudit('approved')">
              <template #icon>
                <CheckOutlined />
              </template>
              {{ t('knowledge.card.batchAuditApprove') }}
            </a-button>
            <a-button @click="openBatchOnline">
              <template #icon>
                <CloudUploadOutlined />
              </template>
              {{ t('knowledge.card.batchOnline') }}
            </a-button>
            <a-dropdown :trigger="['click']">
              <a-button>
                {{ t('common.more') }}
                <DownOutlined class="knowledge-card-list__more-icon" />
              </a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item key="reject" @click="openBatchAudit('rejected')">
                    <CloseOutlined />
                    {{ t('knowledge.card.batchAuditReject') }}
                  </a-menu-item>
                  <a-menu-item key="offline" @click="openBatchOffline">
                    <CloudDownloadOutlined />
                    {{ t('knowledge.card.batchOffline') }}
                  </a-menu-item>
                  <a-menu-item key="delete" danger @click="openBatchDelete">
                    <DeleteOutlined />
                    {{ t('knowledge.card.batchDelete') }}
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </template>
        <template #title="{ row }">
          <div class="flex flex-col">
            <span class="font-medium text-gray-800 dark:text-gray-100">
              {{ (row as KnowledgeCard).title }}
            </span>
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
      @audit-changed="handleViewerAuditChanged"
      @edit="handleEditFromViewer"
      @deleted="fetchData"
    />

    <KnowledgeCardStatusConfirmModal
      v-model:open="statusConfirmOpen"
      :target-status="statusConfirmTargetStatus"
      :confirm-loading="statusConfirmLoading"
      @confirm="handleStatusConfirm"
    />

    <KnowledgeCardAuditModal
      v-model:open="auditModalOpen"
      :action="auditAction"
      :batch-count="batchAuditIds.length"
      :confirm-loading="auditLoading"
      @confirm="handleAuditConfirm"
    />
  </div>
</template>

<style scoped lang="scss">
.knowledge-card-list__batch-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 36px;
  min-width: 0;
}

.knowledge-card-list__batch-count {
  color: var(--color-text-base);
  font-size: 14px;
  font-weight: 500;
}

.knowledge-card-list__batch-clear {
  height: auto;
  padding: 0;
}

.knowledge-card-list__more-icon {
  margin-left: 4px;
  font-size: 12px;
}
</style>
