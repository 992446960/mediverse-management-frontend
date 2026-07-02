<template>
  <div class="excel-preview-loader flex h-full min-h-0 flex-col overflow-hidden">
    <ExcelViewer
      v-if="previewState === 'ready' && renderFileUrl"
      :file-url="renderFileUrl"
      :viewport-size="viewportSize"
      @rendered="emit('rendered')"
      @error="emit('error', $event)"
    />
    <div
      v-else-if="previewState === 'preparing' || previewState === 'converting'"
      class="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 bg-white px-6 dark:bg-slate-900"
    >
      <a-spin />
      <div class="text-sm text-slate-600 dark:text-slate-300">
        {{
          previewState === 'converting'
            ? t('knowledge.previewExcelConverting')
            : t('knowledge.previewExcelPreparing')
        }}
      </div>
      <div
        v-if="previewState === 'converting'"
        class="max-w-[520px] text-center text-xs leading-5 text-slate-500 dark:text-slate-400"
      >
        {{ t('knowledge.previewExcelLegacyRisk') }}
      </div>
    </div>
    <div
      v-else
      class="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 bg-white px-6 dark:bg-slate-900"
    >
      <a-empty :description="fallbackDescription" />
      <a-button type="primary" @click="handleDownload">
        {{ t('knowledge.downloadFile') }}
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import ExcelViewer from './ExcelViewer.vue'
import {
  LEGACY_XLS_MAX_PREVIEW_BYTES,
  detectExcelBinaryKind,
  shouldUseLegacyXlsConversion,
} from './excelFileKind'
import { XlsConvertError, convertLegacyXlsInWorker } from './xlsConvertClient'
import { sanitizeDownloadFilename, triggerFileDownload } from '@/utils/triggerFileDownload'

type ViewportSize = {
  width: number
  height: number
}

type PreviewState = 'preparing' | 'converting' | 'ready' | 'large-or-timeout' | 'failed'

const props = defineProps<{
  fileUrl: string
  fileType?: string
  fileName?: string
  viewportSize?: ViewportSize
}>()

const emit = defineEmits<{
  rendered: []
  error: [err: unknown]
}>()

const { t } = useI18n()

const previewState = ref<PreviewState>('preparing')
const renderFileUrl = ref('')
let currentBlobUrl = ''
let requestVersion = 0
let abortController: AbortController | null = null

const displayName = computed(() => {
  const name = props.fileName?.trim()
  if (name) return name
  return 'excel'
})

const fallbackDescription = computed(() => {
  if (previewState.value === 'large-or-timeout') {
    return t('knowledge.previewExcelLegacyLargeOrTimeout')
  }
  return t('knowledge.previewExcelLegacyFailed')
})

function revokeCurrentBlobUrl() {
  if (!currentBlobUrl) return
  URL.revokeObjectURL(currentBlobUrl)
  currentBlobUrl = ''
}

function setRenderBuffer(buffer: ArrayBuffer) {
  revokeCurrentBlobUrl()
  currentBlobUrl = URL.createObjectURL(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
  )
  renderFileUrl.value = currentBlobUrl
}

async function prepareExcelPreview() {
  const version = ++requestVersion
  abortController?.abort()
  abortController = new AbortController()
  previewState.value = 'preparing'
  renderFileUrl.value = ''
  revokeCurrentBlobUrl()

  try {
    const response = await fetch(props.fileUrl, { signal: abortController.signal })
    if (!response.ok) throw new Error(`fetch excel failed: ${response.status}`)
    const buffer = await response.arrayBuffer()
    if (version !== requestVersion) return

    const binaryKind = detectExcelBinaryKind(buffer)
    const needLegacyConversion = shouldUseLegacyXlsConversion(props.fileType, binaryKind)

    if (!needLegacyConversion) {
      setRenderBuffer(buffer)
      previewState.value = 'ready'
      return
    }

    if (buffer.byteLength > LEGACY_XLS_MAX_PREVIEW_BYTES) {
      previewState.value = 'large-or-timeout'
      return
    }

    previewState.value = 'converting'
    const converted = await convertLegacyXlsInWorker(buffer)
    if (version !== requestVersion) return
    setRenderBuffer(converted)
    previewState.value = 'ready'
  } catch (err) {
    if (version !== requestVersion) return
    if (err instanceof DOMException && err.name === 'AbortError') return
    previewState.value =
      err instanceof XlsConvertError && err.reason === 'timeout' ? 'large-or-timeout' : 'failed'
    emit('error', err)
  }
}

async function handleDownload() {
  try {
    await triggerFileDownload(props.fileUrl, sanitizeDownloadFilename(displayName.value))
  } catch {
    message.error(t('knowledge.downloadFailed'))
  }
}

watch(
  () => [props.fileUrl, props.fileType] as const,
  () => {
    if (!props.fileUrl) {
      previewState.value = 'failed'
      renderFileUrl.value = ''
      revokeCurrentBlobUrl()
      return
    }
    void prepareExcelPreview()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  requestVersion += 1
  abortController?.abort()
  abortController = null
  revokeCurrentBlobUrl()
})
</script>
