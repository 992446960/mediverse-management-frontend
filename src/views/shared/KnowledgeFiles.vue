<template>
  <div class="knowledge-files-shared flex flex-1 overflow-hidden">
    <aside class="w-80 pr-4 flex flex-col shrink-0">
      <DirectoryTree
        :title="t('knowledge.directory')"
        :tree-data="treeData"
        :selected-key="selectedDirId"
        :loading="treeLoading"
        :fetch-data="loadTree"
        @node-click="onTreeSelect"
        @create-dir="handleCreateDir"
      />
    </aside>

    <section class="flex-1 flex flex-col min-h-0 min-w-0 pl-0">
      <div class="app-container p-4 mb-4">
        <PageHead :head-conf="headConf" />
        <PageFilter
          ref="pageFilterRef"
          :filter-conf="filterConf"
          @fetch-table-data="onFilterFetch"
        />
      </div>
      <div class="app-container p-0 flex-1 flex flex-col min-h-0">
        <PageTable
          ref="pageTableRef"
          :table-conf="tableConf"
          :table-columns="tableColumns"
          :table-data="tableData"
          @fetch-table-data="onTableFetch"
        >
          <template #status="{ row }">
            <a-tooltip
              v-if="(row as FileListItem).status === 'failed' && (row as FileListItem).error_msg"
              :title="(row as FileListItem).error_msg"
            >
              <a-tag :color="getStatusColor((row as FileListItem).status)">
                {{ getStatusLabel((row as FileListItem).status) }}
              </a-tag>
            </a-tooltip>
            <a-tag v-else :color="getStatusColor((row as FileListItem).status)">
              {{ getStatusLabel((row as FileListItem).status) }}
            </a-tag>
          </template>
        </PageTable>
      </div>
    </section>

    <a-modal
      v-model:open="uploadModalVisible"
      :title="t('knowledge.uploadFile')"
      width="560px"
      :mask-closable="false"
      @cancel="onUploadModalCancel"
    >
      <FileUploader
        ref="fileUploaderRef"
        :owner-type="props.ownerType"
        :owner-id="props.ownerId"
        :queue="uploadQueue"
        :tree-data="treeData"
        @add-to-queue="addToQueue"
        @success="onUploadSuccess"
      />
      <template #footer>
        <a-button @click="onUploadModalCancel">{{ t('common.cancel') }}</a-button>
        <a-button
          type="primary"
          :loading="isUploading"
          :disabled="pendingCount === 0"
          @click="onUploadStart"
        >
          {{ t('knowledge.uploadStart') }}
        </a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { message, Modal } from 'ant-design-vue'
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  ExportOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue'
import { DirectoryTree } from '@/components/DirectoryTree'
import FileUploader from '@/components/FileUploader/index.vue'
import PageHead from '@/components/PageHead/index.vue'
import PageFilter from '@/components/PageFilter/index.vue'
import PageTable from '@/components/PageTable/index.vue'
import { useFileStatusPoll } from '@/composables/useFileStatusPoll'
import type { UploadQueueItem } from '@/components/FileUploader/types'
import { getDirectoryTree, createDirectory, getFileList, deleteFile } from '@/api/knowledge'
import { confirmDelete } from '@/utils/confirm'
import { stashKnowledgePreviewFile } from '@/utils/knowledgePreviewStash'
import { openFilePreview } from '@/utils/fileType'
import { sanitizeDownloadFilename, triggerFileDownload } from '@/utils/triggerFileDownload'
import { FILE_STATUS_CONFIG } from '@/types/knowledge'
import type { PageHeadConfig } from '@/components/PageHead/types'
import type { PageFilterConfig } from '@/components/PageFilter/types'
import type { PageTableConfig, PageTableColumnConfig } from '@/components/PageTable/types'
import {
  getFileOriginalUrl,
  type OwnerType,
  type DirectoryNode,
  type FileListItem,
  type FileStatus,
} from '@/types/knowledge'

const props = defineProps<{
  ownerType: OwnerType
  ownerId: string
  title: string
}>()

const { t } = useI18n()
const router = useRouter()

const pageFilterRef = ref<InstanceType<typeof PageFilter> | null>(null)
const pageTableRef = ref<InstanceType<typeof PageTable> | null>(null)

const tableData = ref<FileListItem[]>([])
const loading = ref(false)
const total = ref(0)

// ----- 左侧目录树（保持不变） -----
const treeLoading = ref(false)
const treeData = ref<DirectoryNode[]>([])
const selectedDirId = ref('__all__')

async function loadTree() {
  treeLoading.value = true
  try {
    treeData.value = await getDirectoryTree(props.ownerType, props.ownerId)
  } finally {
    treeLoading.value = false
  }
}

function onTreeSelect(payload: { key: string }) {
  selectedDirId.value = payload.key
  pageTableRef.value?.resetCurPage(1)
  loadData()
}

async function handleCreateDir(parentId: string | null, name: string) {
  try {
    await createDirectory(props.ownerType, props.ownerId, { parent_id: parentId, name })
    message.success(t('common.success'))
    loadTree()
  } catch {
    // 错误已由拦截器处理
  }
}

// ----- 状态列展示（FILE_STATUS_CONFIG + i18n 映射） -----
const FILE_STATUS_LABEL_KEYS: Record<FileStatus, string> = {
  uploading: 'knowledge.statusProcessing',
  parsing: 'knowledge.statusProcessing',
  extracting: 'knowledge.statusProcessing',
  indexing: 'knowledge.statusProcessing',
  done: 'knowledge.statusDone',
  failed: 'knowledge.statusFailed',
}

function getStatusColor(status: FileStatus): string {
  return FILE_STATUS_CONFIG[status]?.color ?? 'default'
}

function getStatusLabel(status: FileStatus): string {
  const key = FILE_STATUS_LABEL_KEYS[status]
  if (key) return t(key)
  return FILE_STATUS_CONFIG[status]?.label ?? status
}

// ----- 上传队列与弹窗 -----
const fileUploaderRef = ref<InstanceType<typeof FileUploader> | null>(null)
const uploadQueue = ref<UploadQueueItem[]>([])
const uploadModalVisible = ref(false)
const hasUserStartedUpload = ref(false)

const pendingCount = computed(() => uploadQueue.value.filter((i) => i.status === 'pending').length)
const isUploading = computed(() => uploadQueue.value.some((i) => i.status === 'uploading'))
/** 实际上传中的个数（status === 'uploading'），用于「上传中 (X)」展示 */
const uploadingCount = computed(
  () => uploadQueue.value.filter((i) => i.status === 'uploading').length
)
const allDone = computed(
  () =>
    uploadQueue.value.length > 0 &&
    uploadQueue.value.every((i) => i.status === 'success' || i.status === 'fail')
)

function openUploadModal() {
  uploadModalVisible.value = true
}

function addToQueue(item: UploadQueueItem) {
  uploadQueue.value.push(item)
}

function onUploadStart() {
  hasUserStartedUpload.value = true
  fileUploaderRef.value?.startUpload?.()
}

function clearUploadQueue() {
  uploadQueue.value = []
  hasUserStartedUpload.value = false
}

function onUploadModalCancel() {
  const n = uploadingCount.value
  if (n > 0) {
    Modal.confirm({
      title: t('knowledge.uploadCloseConfirmTitle'),
      content: t('knowledge.uploadCloseConfirmContent', { count: n }),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: () => {
        uploadModalVisible.value = false
      },
    })
  } else {
    uploadModalVisible.value = false
    if (allDone.value) {
      clearUploadQueue()
    }
  }
}

function onUploadSuccess() {
  loadData()
  startPoll()
  message.success(t('knowledge.uploadSuccess'))
}

function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (uploadingCount.value > 0) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

watch(
  uploadingCount,
  (count) => {
    if (count > 0) {
      window.addEventListener('beforeunload', handleBeforeUnload)
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  },
  { immediate: true }
)

watch([uploadModalVisible, allDone], ([visible, done]) => {
  if (!visible && done) {
    clearUploadQueue()
  }
})

const headConf = computed<PageHeadConfig>(() => {
  const btns: PageHeadConfig['btns'] = [
    {
      text: t('knowledge.uploadFile'),
      type: 'primary',
      icon: UploadOutlined,
      handle: openUploadModal,
    },
  ]
  const hasActive = uploadQueue.value.length > 0 && !allDone.value
  if (hasActive) {
    const isPending = !hasUserStartedUpload.value && pendingCount.value > 0
    const text = isPending
      ? t('knowledge.pendingUploadCount', { count: pendingCount.value })
      : t('knowledge.uploadingCount', { count: uploadingCount.value })
    btns.push({
      text,
      type: 'link',
      show: true,
      handle: openUploadModal,
    })
  }
  return {
    title: props.title,
    btns,
  }
})

const filterConf = computed<PageFilterConfig>(() => ({
  filterForm: [
    {
      key: 'keyword',
      label: t('common.search'),
      type: 'input',
      ph: t('knowledge.searchFilePlaceholder'),
      col: 8,
      defaultValue: '',
    },
    {
      key: 'status',
      label: t('knowledge.fileStatus'),
      type: 'select',
      ph: t('common.all'),
      col: 6,
      options: [
        { label: t('common.all'), value: '' },
        { label: t('knowledge.statusProcessing'), value: 'processing' },
        { label: t('knowledge.statusDone'), value: 'done' },
        { label: t('knowledge.statusFailed'), value: 'failed' },
      ],
      clearable: true,
      defaultValue: '',
    },
  ],
  btns: [
    {
      text: t('common.search'),
      type: 'primary',
      icon: SearchOutlined,
      handle: () => {
        pageTableRef.value?.resetCurPage(1)
        loadData()
      },
    },
    {
      text: t('common.reset'),
      icon: ReloadOutlined,
      handle: () => {
        pageFilterRef.value?.filterFormReset()
        pageTableRef.value?.resetCurPage(1)
        loadData()
      },
    },
  ],
  btnsCol: 6,
}))

const tableConf = computed<PageTableConfig>(() => ({
  isLoading: loading.value,
  total: total.value,
  updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  rowKey: 'id',
  emptyText: t('common.noData'),
}))

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

const tableColumns = computed<PageTableColumnConfig[]>(() => [
  {
    label: t('knowledge.fileName'),
    prop: 'file_name',
    width: 200,
    showOverflowTooltip: true,
    fixed: 'left',
  },
  { label: t('knowledge.fileType'), prop: 'file_type', width: 100 },
  {
    label: t('knowledge.fileSize'),
    prop: 'file_size',
    width: 120,
    formatter: (row) => formatFileSize(Number(row.file_size ?? 0)),
  },
  {
    label: t('knowledge.cardCount'),
    prop: 'knowledge_card_count',
    width: 120,
  },
  {
    label: t('knowledge.status'),
    prop: 'status',
    type: 'slot',
    slotName: 'status',
    width: 160,
  },
  {
    label: t('knowledge.publishOrg'),
    prop: 'created_by_name',
    width: 160,
    showOverflowTooltip: true,
  },
  {
    label: t('knowledge.publishTime'),
    prop: 'created_at',
    width: 180,
    formatter: (row) =>
      row.created_at ? dayjs(row.created_at as string).format('YYYY-MM-DD HH:mm') : '—',
  },
  {
    label: t('common.actions'),
    type: 'operation',
    width: 360,
    fixed: 'right',
    btns: [
      {
        text: t('knowledge.preview'),
        icon: EyeOutlined,
        handle: (row: Record<string, unknown>) => handlePreview(row as unknown as FileListItem),
      },
      {
        text: t('knowledge.previewInNewWindow'),
        icon: ExportOutlined,
        handle: (row: Record<string, unknown>) =>
          handleUniversalPreview(row as unknown as FileListItem),
      },
      {
        text: t('knowledge.download'),
        icon: DownloadOutlined,
        handle: (row: Record<string, unknown>) => handleDownload(row as unknown as FileListItem),
      },
      {
        text: t('common.more'),
        type: 'popover',
        moreList: [
          {
            text: t('common.delete'),
            icon: DeleteOutlined,
            color: 'danger',
            handle: (row: Record<string, unknown>) => handleDelete(row as unknown as FileListItem),
          },
          {
            text: t('knowledge.retry'),
            icon: ReloadOutlined,
            btnIsShow: (row) => (row.status as string) === 'failed',
            handle: () => handleRetry(),
          },
        ],
      },
    ],
  },
])

// ----- 数据拉取 -----
async function loadData() {
  const params = pageFilterRef.value?.filteParams ?? {}
  const page = pageTableRef.value?.currentPage ?? 1
  const pageSize = pageTableRef.value?.pageSize ?? 20
  const keyword = (params.keyword as string)?.trim() || undefined
  const statusVal = params.status as string
  const status: FileStatus | undefined =
    statusVal === 'processing' || statusVal === 'done' || statusVal === 'failed'
      ? (statusVal as FileStatus)
      : undefined
  const dirId = selectedDirId.value === '__all__' ? undefined : selectedDirId.value

  loading.value = true
  try {
    const result = await getFileList(props.ownerType, props.ownerId, {
      page,
      page_size: pageSize,
      dir_id: dirId,
      keyword,
      status,
    })
    tableData.value = result.items
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function onFilterFetch() {
  pageTableRef.value?.resetCurPage(1)
  loadData()
}

function onTableFetch() {
  loadData()
}

// ----- 状态轮询 -----
const { startPoll } = useFileStatusPoll(props.ownerType, props.ownerId, tableData)

watch(
  tableData,
  (newList) => {
    const hasActive = newList.some((f) => f.status !== 'done' && f.status !== 'failed')
    if (hasActive) startPoll()
  },
  { deep: true }
)

// ----- 操作列行为 -----
const PREVIEW_ROUTE_NAMES: Record<OwnerType, string> = {
  personal: 'MyFilesPreview',
  dept: 'DeptFilesPreview',
  org: 'OrgFilesPreview',
  avatar: 'AvatarFilesPreview',
}

function handlePreview(record: FileListItem) {
  if (!(getFileOriginalUrl(record) || record.parsed_file_url)) {
    message.warning(t('knowledge.previewNoUrlHint'))
    return
  }
  const name = PREVIEW_ROUTE_NAMES[props.ownerType]
  stashKnowledgePreviewFile(record)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- FileListItem 需通过 state 传递，HistoryState 类型限制
  router.push({ name, params: { id: record.id }, state: { file: record } as any })
}

/** 通用 URL 预览页（无知识卡侧栏），需已存在可访问的原文件地址 */
function handleUniversalPreview(record: FileListItem) {
  const url = getFileOriginalUrl(record)
  if (!url) {
    message.warning(t('knowledge.previewNoUrlHint'))
    return
  }
  openFilePreview(url, record.file_name)
}

function handleDelete(record: FileListItem) {
  confirmDelete({
    title: t('common.confirmDeleteTitle'),
    content: t('common.confirmDeleteContent'),
    okText: t('common.confirm'),
    cancelText: t('common.cancel'),
    onOk: async () => {
      await deleteFile(props.ownerType, props.ownerId, record.id)
      message.success(t('common.success'))
      loadData()
    },
  })
}

async function handleDownload(record: FileListItem) {
  const url = getFileOriginalUrl(record)
  if (!url) {
    message.error(t('knowledge.downloadFailed'))
    return
  }
  try {
    await triggerFileDownload(url, sanitizeDownloadFilename(record.file_name))
  } catch {
    message.error(t('knowledge.downloadFailed'))
  }
}

async function handleRetry() {
  // 打开上传弹窗，让用户重新上传
  openUploadModal()
  // TODO: 如果需要预填目录，可以在这里设置 selectedDirId 或传递给 FileUploader
}

onMounted(() => {
  loadTree()
  loadData()
})
</script>

<style scoped>
:deep(.text-primary),
:deep(.ant-menu-item .text-primary),
:deep(.ant-menu-item .anticon.text-primary) {
  color: var(--color-primary) !important;
}
</style>
