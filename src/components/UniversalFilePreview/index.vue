<template>
  <div class="universal-file-preview flex min-h-0 w-full flex-1 flex-col">
    <header
      class="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3"
      style="border-color: var(--color-border)"
    >
      <span class="min-w-0 truncate text-base font-semibold" style="color: var(--color-text-base)">
        {{ displayName }}
      </span>
      <a-button type="primary" @click="handleDownload">
        <template #icon><DownloadOutlined /></template>
        {{ t('knowledge.downloadFile') }}
      </a-button>
    </header>

    <div class="min-h-0 flex-1 overflow-hidden p-4">
      <a-spin :spinning="contentLoading" class="block h-full min-h-[400px] w-full">
        <div class="flex h-full min-h-[400px] flex-col overflow-hidden">
          <PdfViewer
            v-if="category === 'pdf'"
            :file-url="fileUrl"
            @rendered="onOfficeReady"
            @error="onOfficeReady"
          />
          <DocxViewer
            v-else-if="category === 'docx'"
            :file-url="fileUrl"
            @rendered="onOfficeReady"
            @error="onOfficeReady"
          />
          <ExcelViewer
            v-else-if="category === 'xlsx'"
            :file-url="fileUrl"
            @rendered="onOfficeReady"
            @error="onOfficeReady"
          />
          <TextFileViewer
            v-else-if="category === 'text'"
            :file-url="fileUrl"
            :file-type="textFileType"
          />
          <div
            v-else-if="category === 'image'"
            class="flex min-h-0 flex-1 items-center justify-center overflow-auto"
          >
            <img
              :src="fileUrl"
              :alt="displayName"
              class="max-h-full max-w-full object-contain"
              @load="onMediaReady"
              @error="onMediaReady"
            />
          </div>
          <video
            v-else-if="category === 'video'"
            :src="fileUrl"
            controls
            class="max-h-full w-full max-w-full bg-black"
            @loadeddata="onMediaReady"
            @error="onMediaReady"
          />
          <div
            v-else-if="category === 'audio'"
            class="flex min-h-[200px] flex-col items-center justify-center gap-4 p-6"
          >
            <audio
              :src="fileUrl"
              controls
              class="w-full max-w-xl"
              @canplay="onMediaReady"
              @error="onMediaReady"
            />
          </div>
          <div v-else class="flex min-h-[400px] flex-col items-center justify-center gap-4 py-12">
            <a-empty :description="t('knowledge.unsupportedFileType')" />
            <a-button type="primary" @click="handleDownload">
              <template #icon><DownloadOutlined /></template>
              {{ t('knowledge.downloadFile') }}
            </a-button>
          </div>
        </div>
      </a-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { DownloadOutlined } from '@ant-design/icons-vue'
import DocxViewer from '@/components/FilePreview/DocxViewer.vue'
import ExcelViewer from '@/components/FilePreview/ExcelViewer.vue'
import PdfViewer from '@/components/FilePreview/PdfViewer.vue'
import TextFileViewer from '@/components/FilePreview/TextFileViewer.vue'
import type { FileCategory } from '@/utils/fileType'
import { getFileCategory, getTextViewerFileType } from '@/utils/fileType'
import { sanitizeDownloadFilename, triggerFileDownload } from '@/utils/triggerFileDownload'

const { t } = useI18n()

const props = defineProps<{
  fileUrl: string
  fileName?: string
}>()

const displayName = computed(() => {
  const n = props.fileName?.trim()
  if (n) return n
  try {
    const u = new URL(props.fileUrl)
    const seg = u.pathname.split('/').filter(Boolean).pop()
    return seg || props.fileUrl
  } catch {
    return props.fileUrl
  }
})

const category = computed<FileCategory>(() => getFileCategory(props.fileUrl, props.fileName))

const textFileType = computed(() => getTextViewerFileType(props.fileName, props.fileUrl))

const contentLoading = ref(true)

watch(
  () => [props.fileUrl, props.fileName] as const,
  () => {
    const cat = getFileCategory(props.fileUrl, props.fileName)
    if (cat === 'text' || cat === 'unknown') contentLoading.value = false
    else contentLoading.value = true
  },
  { immediate: true }
)

function onOfficeReady() {
  contentLoading.value = false
}

function onMediaReady() {
  contentLoading.value = false
}

async function handleDownload() {
  try {
    await triggerFileDownload(props.fileUrl, sanitizeDownloadFilename(displayName.value))
  } catch {
    message.error(t('knowledge.downloadFailed'))
  }
}
</script>

<style scoped>
.universal-file-preview {
  background-color: var(--color-bg-container);
}
</style>
