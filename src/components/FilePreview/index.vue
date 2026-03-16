<template>
  <div class="file-preview flex flex-col h-full w-full">
    <div class="app-container p-4 mb-4">
      <PageHead :head-conf="headConf">
        <template #title>
          <div v-if="file" class="flex flex-col min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                {{ file.file_name }}
              </span>
            </div>
            <div class="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
              {{ WORKSPACE_LABELS[ownerType] }} · {{ dayjs(file.created_at).format('YYYY-MM-DD') }}
            </div>
          </div>
          <span v-else class="text-base font-bold text-slate-800 dark:text-slate-100">
            {{ t('knowledge.filePreview') }}
          </span>
        </template>
        <template v-if="file">
          <div class="flex items-center gap-3">
            <a-tag :color="getStatusBadgeColor(file.status)">
              {{ STATUS_BADGE[file.status] ?? t('knowledge.statusProcessing') }}
            </a-tag>
            <a-button
              type="primary"
              class="transition-colors duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              @click="handleDownload"
            >
              <template #icon><DownloadOutlined /></template>
              {{ t('knowledge.downloadOriginal') }}
            </a-button>
          </div>
        </template>
      </PageHead>
    </div>

    <div class="flex-1 flex min-h-0 gap-4">
      <!-- 左侧：文件内容预览 -->
      <div class="app-container flex-[2] flex flex-col min-w-0 p-4">
        <section class="flex flex-col flex-1 min-h-0">
          <h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            {{ t('knowledge.fileContentPreview') }}
          </h3>
          <a-tabs
            v-if="showPdfTabs"
            v-model:active-key="activeView"
            type="line"
            class="file-preview__tabs mb-3"
          >
            <a-tab-pane key="parsed" :tab="t('knowledge.parsedView')" />
            <a-tab-pane key="original" :tab="t('knowledge.rawView')" />
          </a-tabs>
          <div
            class="flex-1 min-h-[400px] overflow-hidden border border-slate-200 dark:border-slate-700 rounded-lg"
          >
            <!-- PDF 解析视图 -->
            <ParsedDocViewer
              v-if="showPdfTabs && activeView === 'parsed'"
              :parsed-file-url="file?.parsed_file_url ?? null"
            />
            <!-- PDF 原文视图：使用绝对 URL 确保 vue-office 内部 fetch 能命中 MSW -->
            <PdfViewer
              v-else-if="file?.file_type === 'pdf' && pdfAbsoluteUrl"
              :key="`pdf-${file?.id ?? ''}-original`"
              :file-url="pdfAbsoluteUrl"
            />
            <!-- Docx -->
            <DocxViewer
              v-else-if="file?.file_type === 'docx' && file?.file_url"
              :file-url="file.file_url"
            />
            <!-- Excel -->
            <ExcelViewer
              v-else-if="file?.file_type === 'xlsx' && file?.file_url"
              :file-url="file.file_url"
            />
            <!-- 文本型：txt, md, json, jsonl, csv -->
            <TextFileViewer
              v-else-if="isTextType && file?.file_url"
              :file-url="file.file_url"
              :file-type="file.file_type"
            />
            <a-empty
              v-else-if="!loading && file"
              :description="t('knowledge.unsupportedPreview')"
            />
            <a-spin v-else-if="loading" class="w-full py-12" />
            <a-empty v-else-if="error" :description="error" />
          </div>
        </section>
      </div>

      <!-- 右侧：抽取知识卡 -->
      <div class="app-container flex-1 w-80 shrink-0 min-w-0 p-4">
        <aside class="h-full flex flex-col">
          <KnowledgeCardSidebar
            :cards="cards"
            :source-file-name="file?.file_name"
            :loading="cardsLoading"
          />
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { DownloadOutlined } from '@ant-design/icons-vue'
import PageHead from '@/components/PageHead/index.vue'
import PdfViewer from './PdfViewer.vue'
import DocxViewer from './DocxViewer.vue'
import ExcelViewer from './ExcelViewer.vue'
import ParsedDocViewer from './ParsedDocViewer.vue'
import TextFileViewer from './TextFileViewer.vue'
import KnowledgeCardSidebar from './KnowledgeCardSidebar.vue'
import { getFileCards } from '@/api/knowledge'
import type { PageHeadConfig } from '@/components/PageHead/types'
import type { OwnerType, FileListItem, FileStatus, FileCard } from '@/types/knowledge'

const { t } = useI18n()

const props = defineProps<{
  ownerType: OwnerType
  ownerId: string
  fileId: string
  /** 列表项，由父组件通过路由 state 传入，避免单独请求文件详情 */
  file?: FileListItem | null
}>()

const file = computed(() => props.file ?? null)
const cards = ref<FileCard[]>([])
const loading = ref(false)
const cardsLoading = ref(false)
const error = ref<string | null>(null)
const activeView = ref<'parsed' | 'original'>('parsed')

const WORKSPACE_LABELS = computed<Record<OwnerType, string>>(() => ({
  personal: t('knowledge.ownerPersonal'),
  dept: t('knowledge.ownerDept'),
  org: t('knowledge.ownerOrg'),
  avatar: t('knowledge.ownerAvatar'),
}))

const STATUS_BADGE = computed<Record<FileStatus, string>>(() => ({
  uploading: t('knowledge.statusProcessing'),
  parsing: t('knowledge.statusProcessing'),
  extracting: t('knowledge.statusProcessing'),
  indexing: t('knowledge.statusProcessing'),
  done: t('knowledge.statusBadgeParsed'),
  failed: t('knowledge.statusBadgeFailed'),
}))

const isTextType = computed(() => {
  const fileType = file.value?.file_type?.toLowerCase()
  return ['txt', 'md', 'json', 'jsonl', 'csv'].includes(fileType ?? '')
})

const showPdfTabs = computed(() => file.value?.file_type?.toLowerCase() === 'pdf')

/** 原文视图 PDF 地址：转为绝对 URL，确保 @vue-office/pdf 内部 fetch 能命中 MSW */
const pdfAbsoluteUrl = computed(() => {
  const url = file.value?.file_type?.toLowerCase() === 'pdf' ? file.value?.file_url : undefined
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return new URL(url, window.location.origin).href
})

const STATUS_BADGE_COLORS: Record<FileStatus, string> = {
  uploading: 'blue',
  parsing: 'blue',
  extracting: 'blue',
  indexing: 'blue',
  done: 'green',
  failed: 'red',
}

function getStatusBadgeColor(status: FileStatus): string {
  return STATUS_BADGE_COLORS[status] ?? 'default'
}

const headConf = computed<PageHeadConfig>(() => {
  const subtitle = file.value
    ? `${WORKSPACE_LABELS.value[props.ownerType]} · ${dayjs(file.value.created_at).format('YYYY-MM-DD')}`
    : ''
  const title = file.value
    ? `${file.value.file_name}${subtitle ? ` · ${subtitle}` : ''}`
    : t('knowledge.filePreview')

  const tabsOptions = showPdfTabs.value
    ? [
        { label: t('knowledge.parsedView'), value: 'parsed' },
        { label: t('knowledge.rawView'), value: 'original' },
      ]
    : undefined

  return {
    backLeft: true,
    title,
    defaultTab: 'parsed',
    tabsOptions,
    tabChangeHandle: (key: string | number) => {
      activeView.value = key as 'parsed' | 'original'
    },
  }
})

async function loadCards() {
  cardsLoading.value = true
  try {
    cards.value = await getFileCards(props.ownerType, props.ownerId, props.fileId)
  } catch {
    cards.value = []
  } finally {
    cardsLoading.value = false
  }
}

function handleDownload() {
  if (!file.value?.file_url) return
  window.open(file.value.file_url, '_blank')
}

watch(
  () => [props.ownerType, props.ownerId, props.fileId],
  () => {
    loadCards()
  },
  { immediate: false }
)

onMounted(() => {
  loadCards()
})
</script>

<style scoped>
/* P1/P2: Tab 选中态与未选中态区分明显，cursor、focus-visible、transition */
.file-preview__tabs :deep(.ant-tabs-tab) {
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s;
}
.file-preview__tabs :deep(.ant-tabs-tab-active) {
  font-weight: 600;
  color: var(--ant-color-primary);
}
.file-preview__tabs :deep(.ant-tabs-tab:focus-visible) {
  outline: 2px solid var(--ant-color-primary);
  outline-offset: 2px;
}
</style>
