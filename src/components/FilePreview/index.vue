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
          <span v-else class="text-base font-bold text-slate-800 dark:text-slate-100"
            >文件预览</span
          >
        </template>
        <template v-if="file">
          <div class="flex items-center gap-3">
            <a-tag :color="getStatusBadgeColor(file.status)">
              {{ STATUS_BADGE[file.status] ?? '处理中' }}
            </a-tag>
            <a-button
              type="primary"
              class="transition-colors duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              @click="handleDownload"
            >
              <template #icon><DownloadOutlined /></template>
              原文件下载
            </a-button>
          </div>
        </template>
      </PageHead>
    </div>

    <div class="flex-1 flex min-h-0 gap-4">
      <!-- 左侧：文件内容预览 -->
      <div class="app-container flex-[2] flex flex-col min-w-0 p-4">
        <section class="flex flex-col flex-1 min-h-0">
          <h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">文件内容预览</h3>
          <a-tabs
            v-if="showPdfTabs"
            v-model:active-key="activeView"
            type="line"
            class="file-preview__tabs mb-3"
          >
            <a-tab-pane key="parsed" tab="解析视图" />
            <a-tab-pane key="original" tab="原文视图" />
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
            <a-empty v-else-if="!loading && file" description="暂不支持该类型预览" />
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
import { ref, computed, watch, onMounted } from 'vue'
import dayjs from 'dayjs'
import { DownloadOutlined } from '@ant-design/icons-vue'
import PageHead from '@/components/PageHead/index.vue'
import PdfViewer from './PdfViewer.vue'
import DocxViewer from './DocxViewer.vue'
import ExcelViewer from './ExcelViewer.vue'
import ParsedDocViewer from './ParsedDocViewer.vue'
import TextFileViewer from './TextFileViewer.vue'
import KnowledgeCardSidebar from './KnowledgeCardSidebar.vue'
import { getFileDetail, getFileCards } from '@/api/knowledge'
import type { PageHeadConfig } from '@/components/PageHead/types'
import type { OwnerType, FileListItem, FileStatus, FileCard } from '@/types/knowledge'

const props = defineProps<{
  ownerType: OwnerType
  ownerId: string
  fileId: string
}>()

const file = ref<FileListItem | null>(null)
const cards = ref<FileCard[]>([])
const loading = ref(false)
const cardsLoading = ref(false)
const error = ref<string | null>(null)
const activeView = ref<'parsed' | 'original'>('parsed')

const WORKSPACE_LABELS: Record<OwnerType, string> = {
  personal: '个人',
  dept: '科室',
  org: '机构',
  avatar: '分身',
}

const STATUS_BADGE: Record<FileStatus, string> = {
  uploading: '处理中',
  parsing: '处理中',
  extracting: '处理中',
  indexing: '处理中',
  done: '已解析',
  failed: '解析失败',
}

const isTextType = computed(() => {
  const t = file.value?.file_type?.toLowerCase()
  return ['txt', 'md', 'json', 'jsonl', 'csv'].includes(t ?? '')
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
    ? `${WORKSPACE_LABELS[props.ownerType]} · ${dayjs(file.value.created_at).format('YYYY-MM-DD')}`
    : ''
  const title = file.value
    ? `${file.value.file_name}${subtitle ? ` · ${subtitle}` : ''}`
    : '文件预览'

  const tabsOptions = showPdfTabs.value
    ? [
        { label: '解析视图', value: 'parsed' },
        { label: '原文视图', value: 'original' },
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

async function loadFile() {
  loading.value = true
  error.value = null
  try {
    file.value = await getFileDetail(props.ownerType, props.ownerId, props.fileId)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载文件失败'
    file.value = null
  } finally {
    loading.value = false
  }
}

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
    loadFile()
    loadCards()
  },
  { immediate: false }
)

onMounted(() => {
  loadFile()
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
