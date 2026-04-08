<template>
  <div class="file-uploader">
    <a-upload-dragger
      :accept="accept"
      :multiple="true"
      :show-upload-list="false"
      :before-upload="beforeUpload"
      :custom-request="noopRequest"
    >
      <p class="ant-upload-drag-icon">
        <InboxOutlined class="text-4xl text-primary" />
      </p>
      <p class="ant-upload-text">{{ t('knowledge.uploadDragText') }}</p>
      <p class="ant-upload-hint">
        {{ t('knowledge.uploadAcceptHint', { accept: acceptDisplay }) }}
      </p>
      <p class="ant-upload-hint">{{ t('knowledge.uploadSizeHint', { size: maxSizeDisplay }) }}</p>
    </a-upload-dragger>

    <div class="mt-4">
      <div class="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        {{ t('knowledge.uploadCategoryMethod') }}
      </div>
      <a-radio-group v-model:value="uploadMode" class="mb-3">
        <a-radio value="auto">{{ t('knowledge.uploadAutoCategory') }}</a-radio>
        <a-radio value="manual">{{ t('knowledge.uploadManualCategory') }}</a-radio>
      </a-radio-group>
      <div v-if="uploadMode === 'manual'" class="mt-2">
        <div class="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          {{ t('knowledge.uploadSelectDirectoryLabel') }}
        </div>
        <a-tree-select
          v-model:value="selectedDirId"
          :tree-data="directoryTreeSelectData"
          :placeholder="t('knowledge.selectDirectory')"
          allow-clear
          tree-default-expand-all
          class="w-full"
          :field-names="{ label: 'title', value: 'value' }"
        />
      </div>
      <p v-if="queue.length > 0" class="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {{ t('knowledge.uploadQueueHint') }}
      </p>
    </div>

    <div v-if="queue.length > 0" class="mt-4 space-y-2">
      <div
        v-for="item in queue"
        :key="item.uid"
        class="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
      >
        <span class="min-w-0 flex-1 truncate text-sm" :title="item.fileName">{{
          item.fileName
        }}</span>
        <a-tag :color="queueStatusColor(item.status)">{{ queueStatusLabel(item.status) }}</a-tag>
        <div v-if="item.status === 'uploading'" class="w-24 shrink-0">
          <a-progress :percent="item.percent" size="small" />
        </div>
        <template v-if="item.status === 'fail'">
          <span
            v-if="item.error"
            class="min-w-0 flex-1 text-xs leading-snug text-red-500"
            :title="item.error"
          >
            {{ item.error }}
          </span>
          <a-button type="link" size="small" class="shrink-0 px-0" @click="retryItem(item)">
            {{ t('knowledge.retry') }}
          </a-button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { InboxOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { uploadFile } from '@/api/knowledge'
import type { OwnerType, DirectoryNode } from '@/types/knowledge'
import type { UploadFileResult } from '@/types/knowledge'
import type { UploadQueueItem } from './types'
import { getUploadErrorMessage } from '@/utils/uploadErrorMessage'
import { KNOWLEDGE_FILE_ACCEPT } from '@/utils/documentUploadAccept'

const MAX_SIZE_DEFAULT = 50 * 1024 * 1024
const MAX_COUNT_DEFAULT = 20
const CONCURRENT = 3

interface Props {
  ownerType: OwnerType
  ownerId: string
  dirId?: string
  accept?: string
  maxSize?: number
  maxCount?: number
  /** 上传队列（由父组件持有，关闭弹窗后仍可查看进度） */
  queue: UploadQueueItem[]
  /** 目录树数据，用于「手动选择分类」时的目录选择器 */
  treeData?: DirectoryNode[]
}

const props = withDefaults(defineProps<Props>(), {
  accept: () => KNOWLEDGE_FILE_ACCEPT,
  maxSize: MAX_SIZE_DEFAULT,
  maxCount: MAX_COUNT_DEFAULT,
  treeData: () => [],
})

const emit = defineEmits<{
  (e: 'success', results: UploadFileResult[]): void
  (e: 'add-to-queue', item: UploadQueueItem): void
}>()

const { t } = useI18n()

const uploadMode = ref<'auto' | 'manual'>('auto')
const selectedDirId = ref<string | undefined>(undefined)

const queue = computed(() => props.queue)

interface TreeSelectNode {
  key: string
  value: string
  title: string
  children?: TreeSelectNode[]
}

/** 目录树转为 TreeSelect 数据 */
const directoryTreeSelectData = computed(() => {
  const map = (nodes: DirectoryNode[]): TreeSelectNode[] =>
    nodes.map((n) => ({
      key: n.id,
      value: n.id,
      title: n.name,
      children: n.children?.length ? map(n.children) : undefined,
    }))
  return map(props.treeData ?? [])
})

const acceptDisplay = computed(() => props.accept.replace(/\./g, '').toUpperCase())
const maxSizeDisplay = computed(() => `${props.maxSize / 1024 / 1024}MB`)

function queueStatusColor(status: UploadQueueItem['status']): string {
  const map: Record<UploadQueueItem['status'], string> = {
    pending: 'default',
    uploading: 'processing',
    success: 'success',
    fail: 'error',
  }
  return map[status] ?? 'default'
}

function queueStatusLabel(status: UploadQueueItem['status']): string {
  const key: Record<UploadQueueItem['status'], string> = {
    pending: 'knowledge.uploadStatusPending',
    uploading: 'knowledge.uploadStatusUploading',
    success: 'knowledge.uploadStatusSuccess',
    fail: 'knowledge.uploadStatusFail',
  }
  return t(key[status])
}

function getFileExt(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i).toLowerCase() : ''
}

function validateFile(file: File): string | null {
  const ext = getFileExt(file.name)
  const allowed = props.accept.split(',').map((x) => x.trim().toLowerCase())
  if (!allowed.some((a) => a === ext || a === ext.slice(1))) {
    return t('knowledge.uploadFormatInvalid', { name: file.name, accept: props.accept })
  }
  if (file.size > props.maxSize) {
    return t('knowledge.uploadSizeInvalid', { name: file.name, size: maxSizeDisplay.value })
  }
  return null
}

function beforeUpload(file: File): boolean {
  const err = validateFile(file)
  if (err) {
    message.error(err)
    return false
  }
  const current = props.queue.length
  if (current >= props.maxCount) {
    message.error(t('knowledge.uploadMaxCountInvalid', { max: props.maxCount }))
    return false
  }
  const uid = `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const newItem: UploadQueueItem = {
    uid,
    file,
    fileName: file.name,
    status: 'pending',
    percent: 0,
  }
  emit('add-to-queue', newItem)
  return false
}

function noopRequest() {
  // 使用 customRequest 阻止默认上传，实际上传由 processQueue 驱动
}

function retryItem(item: UploadQueueItem) {
  if (item.status !== 'fail') return
  item.status = 'pending'
  item.error = undefined
  item.percent = 0
  item.result = undefined
  processQueue()
}

/** 启动单个文件上传，完成后调用 processQueue 补充下一批 */
function startOneUpload(item: UploadQueueItem) {
  item.status = 'uploading'
  item.percent = 0

  const progressTimer = setInterval(() => {
    if (item.status !== 'uploading') return
    item.percent = Math.min(90, item.percent + 8)
  }, 150)

  const uploadDirId =
    uploadMode.value === 'manual' ? (selectedDirId.value ?? undefined) : props.dirId
  uploadFile(props.ownerType, props.ownerId, item.file, uploadDirId, {
    skipErrorToast: true,
    onUploadProgress: (e) => {
      if (e.total && e.total > 0) item.percent = Math.round((e.loaded / e.total) * 100)
    },
  })
    .then((result) => {
      item.status = 'success'
      item.percent = 100
      item.result = result
      processQueue()
    })
    .catch((err: unknown) => {
      item.status = 'fail'
      item.error = getUploadErrorMessage(err, t)
      processQueue()
    })
    .finally(() => {
      clearInterval(progressTimer)
    })
}

/** 并发控制：最多同时上传 CONCURRENT 个，完成一个从队列取下一个 */
function processQueue() {
  const pending = props.queue.filter((i) => i.status === 'pending')
  const uploading = props.queue.filter((i) => i.status === 'uploading')

  if (pending.length === 0 && uploading.length === 0) {
    const allDone = props.queue.every((i) => i.status === 'success' || i.status === 'fail')
    if (allDone) {
      const results = props.queue
        .filter(
          (i): i is UploadQueueItem & { result: UploadFileResult } =>
            i.status === 'success' && i.result != null
        )
        .map((i) => i.result!)
      if (results.length > 0) emit('success', results)
    }
    return
  }

  const slotsAvailable = CONCURRENT - uploading.length
  if (slotsAvailable <= 0 || pending.length === 0) return

  const toStart = pending.slice(0, slotsAvailable)
  for (const item of toStart) {
    startOneUpload(item)
  }
}

defineExpose({
  startUpload: () => processQueue(),
})
</script>
