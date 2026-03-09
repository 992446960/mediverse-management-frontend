<template>
  <div class="knowledge-files-shared flex flex-1 overflow-hidden">
    <aside class="w-80 pr-4 flex flex-col shrink-0 bg-slate-100 dark:bg-slate-950">
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
      <div class="mb-4">
        <TableFilter
          v-model="filterState"
          :title="title"
          :fields="filterFields"
          @search="onFilterSearch"
          @reset="onFilterReset"
        />
      </div>

      <ProTable
        :title="tableTitle"
        :columns="columns"
        :data-source="data"
        :loading="loading"
        row-key="id"
        :pagination="paginationConfig"
        :toolbar="toolbarConfig"
        @refresh="refresh"
      >
        <template #bodyCell="{ column, record }">
          <!-- 文件名称：用 key 或 dataIndex 匹配（兼容 a-table 列标识），取值兼容 snake_case -->
          <template v-if="(column.key === 'file_name') || (column.dataIndex === 'file_name')">
            <a-tooltip v-if="getFileName(record, column)" :title="getFileName(record, column)">
              <span class="truncate block">{{ getFileName(record, column) }}</span>
            </a-tooltip>
            <span v-else class="text-slate-400">—</span>
          </template>

          <!-- 状态列渲染 -->
          <template v-else-if="column.key === 'status'">
            <a-tooltip v-if="record.status === 'failed'" :title="record.error_msg">
              <a-tag :color="FILE_STATUS_CONFIG[record.status as FileStatus].color">
                {{ FILE_STATUS_CONFIG[record.status as FileStatus].label }}
              </a-tag>
            </a-tooltip>
            <a-tag v-else :color="FILE_STATUS_CONFIG[record.status as FileStatus].color">
              {{ FILE_STATUS_CONFIG[record.status as FileStatus].label }}
            </a-tag>
          </template>

          <!-- 文件大小格式化 -->
          <template v-else-if="column.key === 'file_size'">
            {{ formatFileSize(record.file_size) }}
          </template>

          <!-- 发布时间格式化 -->
          <template v-else-if="column.key === 'created_at'">
            {{ record.created_at ? formatPublishTime(record.created_at) : '—' }}
          </template>

          <!-- 操作列 -->
          <template v-else-if="column.key === 'actions'">
            <div class="flex items-center gap-1">
              <a-dropdown>
                <template #overlay>
                  <a-menu class="action-menu">
                    <a-menu-item key="preview" @click="handlePreview(record)">
                      <template #icon><EyeOutlined style="color: var(--color-primary)" /></template>
                      <span style="color: var(--color-primary)">{{ t('knowledge.preview') }}</span>
                    </a-menu-item>
                    <a-menu-item key="delete" danger @click="handleDelete(record)">
                      <template #icon><DeleteOutlined /></template>
                      {{ t('common.delete') }}
                    </a-menu-item>
                    <a-menu-item key="download" @click="handleDownload(record)">
                      <template #icon><DownloadOutlined style="color: var(--color-primary)" /></template>
                      <span style="color: var(--color-primary)">{{ t('knowledge.download') }}</span>
                    </a-menu-item>
                    <a-menu-item
                      v-if="record.status === 'failed'"
                      key="retry"
                      @click="handleRetry(record)"
                    >
                      <template #icon><ReloadOutlined style="color: var(--color-primary)" /></template>
                      <span style="color: var(--color-primary)">{{ t('knowledge.retry') }}</span>
                    </a-menu-item>
                  </a-menu>
                </template>
                <a-button type="link" size="small">
                  <template #icon><EllipsisOutlined /></template>
                </a-button>
              </a-dropdown>
            </div>
          </template>
        </template>
      </ProTable>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  EllipsisOutlined,
  EyeOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue'
import { DirectoryTree } from '@/components/DirectoryTree'
import { TableFilter } from '@/components/TableFilter'
import { ProTable } from '@/components/Table'
import { useTableData } from '@/composables/useTableData'
import { useFileStatusPoll } from '@/composables/useFileStatusPoll'
import {
  getDirectoryTree,
  createDirectory,
  getFileList,
  retryFile,
  deleteFile,
  downloadFile,
} from '@/api/knowledge'
import { confirmDelete } from '@/utils/confirm'
import { FILE_STATUS_CONFIG } from '@/types/knowledge'
import type { OwnerType, DirectoryNode, FileListItem, FileStatus } from '@/types/knowledge'
import type { TableFilterFieldConfig } from '@/components/TableFilter/types'
import type { ProTablePagination, ProTableToolItem } from '@/components/Table/types'

const props = defineProps<{
  ownerType: OwnerType
  ownerId: string
  title: string
}>()

const { t } = useI18n()

// 目录树相关
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
  onFilterSearch()
}

/** 在树中递归查找节点 */
function findNodeById(nodes: DirectoryNode[], id: string): DirectoryNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children?.length) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return undefined
}

/** 表格标题：选中的目录名，未选或选「全部」时为「所有文件」 */
const tableTitle = computed(() => {
  if (selectedDirId.value === '__all__') return t('knowledge.allFiles')
  const node = findNodeById(treeData.value, selectedDirId.value)
  return node?.name ?? t('knowledge.allFiles')
})

async function handleCreateDir(parentId: string | null, name: string) {
  try {
    await createDirectory(props.ownerType, props.ownerId, { parent_id: parentId, name })
    message.success(t('common.success'))
    loadTree()
  } catch (error) {
    // 错误已由拦截器处理
  }
}

// 表格相关
const filterState = ref({
  keyword: '',
  status: '',
})

const filterFields = computed<TableFilterFieldConfig[]>(() => [
  {
    key: 'keyword',
    label: t('knowledge.fileName'),
    type: 'input',
    placeholder: t('knowledge.searchFilePlaceholder'),
    inputClass: 'w-64',
  },
  {
    key: 'status',
    label: t('knowledge.fileStatus'),
    type: 'select',
    inputClass: 'min-w-[140px]',
    options: [
      { label: t('common.all'), value: '' },
      { label: t('knowledge.statusProcessing'), value: 'processing' },
      { label: t('knowledge.statusDone'), value: 'done' },
      { label: t('knowledge.statusFailed'), value: 'failed' },
    ],
  },
])

const { data, loading, pagination, handleTableChange, handleSearch, refresh } = useTableData<FileListItem, any>({
  fetchFn: (params) => getFileList(props.ownerType, props.ownerId, params),
  immediate: false,
})

// 状态轮询
const { startPoll } = useFileStatusPoll(props.ownerType, props.ownerId, data)

watch(data, (newList) => {
  const hasActive = newList.some((f) => f.status !== 'done' && f.status !== 'failed')
  if (hasActive) startPoll()
}, { deep: true })

function onFilterSearch() {
  handleSearch({
    dir_id: selectedDirId.value,
    keyword: filterState.value.keyword,
    status: filterState.value.status as any,
  })
}

function onFilterReset() {
  filterState.value = { keyword: '', status: '' }
  onFilterSearch()
}

const paginationConfig = computed<ProTablePagination>(() => ({
  current: pagination.current,
  pageSize: pagination.pageSize,
  total: pagination.total,
  onChange: (page, pageSize) => handleTableChange({ current: page, pageSize }),
}))

const toolbarConfig = computed<ProTableToolItem[]>(() => [
  { key: 'refresh', icon: 'reload', title: t('common.refresh'), handle: refresh },
])

const columns = [
  { title: t('knowledge.fileName'), dataIndex: 'file_name', key: 'file_name', ellipsis: true },
  { title: t('knowledge.fileType'), dataIndex: 'file_type', key: 'file_type', width: 100 },
  { title: t('knowledge.fileSize'), dataIndex: 'file_size', key: 'file_size', width: 120 },
  { title: t('knowledge.cardCount'), dataIndex: 'knowledge_card_count', key: 'knowledge_card_count', width: 120 },
  { title: t('knowledge.status'), dataIndex: 'status', key: 'status', width: 180 },
  { title: t('knowledge.publishOrg'), dataIndex: 'created_by_name', key: 'created_by_name', width: 180, ellipsis: true },
  { title: t('knowledge.publishTime'), dataIndex: 'created_at', key: 'created_at', width: 180 },
  { title: t('common.actions'), key: 'actions', width: 120, fixed: 'right' },
]

async function handleRetry(record: FileListItem) {
  try {
    await retryFile(props.ownerType, props.ownerId, record.id)
    message.success(t('common.retrySuccess'))
    refresh()
  } catch (error) {}
}

function handlePreview(record: FileListItem) {
  message.info('TODO: 预览文件功能开发中 - ' + record.file_name)
}

function handleDelete(record: FileListItem) {
  confirmDelete({
    title: t('common.confirmDeleteTitle'),
    content: t('common.confirmDeleteContent'),
    onOk: async () => {
      try {
        await deleteFile(props.ownerType, props.ownerId, record.id)
        message.success(t('common.success'))
        refresh()
      } catch (error) {}
    },
  })
}

async function handleDownload(record: FileListItem) {
  try {
    const blob = await downloadFile(props.ownerType, props.ownerId, record.id)
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', record.file_name)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    message.error(t('knowledge.downloadFailed'))
  }
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/** 从 record 取文件名字段（兼容 dataIndex 与 file_name） */
function getFileName(
  record: FileListItem,
  column: { dataIndex?: string | string[] }
): string {
  const raw =
    record.file_name ??
    (typeof column.dataIndex === 'string'
      ? (record as unknown as Record<string, unknown>)[column.dataIndex]
      : undefined)
  return raw != null ? String(raw) : ''
}

/** 发布时间格式化展示 */
function formatPublishTime(iso: string) {
  const d = dayjs(iso)
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm') : iso
}

onMounted(() => {
  loadTree()
  onFilterSearch()
})
</script>

<style scoped>
:deep(.text-primary),
:deep(.ant-menu-item .text-primary),
:deep(.ant-menu-item .anticon.text-primary) {
  color: var(--color-primary) !important;
}
</style>
