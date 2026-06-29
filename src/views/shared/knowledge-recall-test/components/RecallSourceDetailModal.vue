<template>
  <a-modal
    v-model:open="modelOpen"
    width="min(980px, calc(100vw - 48px))"
    centered
    destroy-on-close
    wrap-class-name="knowledge-recall-detail-modal"
    :body-style="{ padding: 0 }"
  >
    <template #title>
      <div class="knowledge-recall-detail__title min-w-0">
        <div class="flex min-w-0 items-center gap-3">
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sky-50 text-primary dark:bg-sky-950"
          >
            <FileTextOutlined />
          </span>
          <div class="min-w-0">
            <h2 class="m-0 truncate text-lg font-semibold text-(--color-text-base)">
              {{ detailTitle }}
            </h2>
            <div
              class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-normal text-(--color-text-tertiary)"
            >
              <a-tag :color="getLocalizedCardTypeConfig(detailCardType).color" class="m-0">
                {{ getLocalizedCardTypeConfig(detailCardType).label }}
              </a-tag>
              <span>ID: {{ detailCardId }}</span>
              <span>{{ t('common.updatedAt') }}: {{ detailUpdatedAt }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div class="knowledge-recall-detail">
      <div class="knowledge-recall-detail__body">
        <section class="knowledge-recall-detail__content">
          <div
            class="knowledge-recall-detail__markdown markdown-body prose prose-sm max-w-none dark:prose-invert"
          >
            <a-alert
              v-if="detailUsesPreviewContent"
              class="mb-4"
              type="info"
              show-icon
              :message="t('knowledge.recall.previewContentFallbackHint')"
            />
            <!-- eslint-disable-next-line vue/no-v-html -- 召回详情返回的 md_content 为 Markdown，已通过 marked + DOMPurify 清洗 -->
            <div v-if="hasDetailMarkdown" v-html="detailMarkdownHtml" />
            <div v-else class="knowledge-recall-detail__empty">
              <a-empty :description="t('knowledge.recall.noCardContent')" />
            </div>
          </div>
        </section>

        <aside class="knowledge-recall-detail__aside">
          <section class="knowledge-recall-detail__panel">
            <div class="mb-3 flex items-center gap-2 text-sm font-semibold uppercase">
              <BarChartOutlined class="text-primary" />
              <span>{{ t('knowledge.recall.recallPerformance') }}</span>
            </div>
            <div class="rounded-md border border-(--color-border) bg-(--color-bg-container) p-4">
              <div class="text-xs text-(--color-text-secondary)">
                {{ t('knowledge.recall.recallScore') }}
              </div>
              <div class="mt-2 flex items-end gap-2">
                <span class="text-3xl font-semibold leading-none text-primary">
                  {{ selectedRecallScoreText }}
                </span>
              </div>
              <div class="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  class="h-full rounded-full bg-primary"
                  :style="{ width: selectedRecallScorePercent }"
                />
              </div>
            </div>
          </section>

          <section class="knowledge-recall-detail__panel">
            <div class="mb-3 flex items-center gap-2 text-sm font-semibold">
              <LinkOutlined class="text-primary" />
              <span>{{ t('knowledge.recall.relatedFiles') }}</span>
            </div>
            <div v-if="detailSourceFiles.length" class="knowledge-recall-detail__files">
              <button
                v-for="(file, index) in detailSourceFiles"
                :key="file.id || file.name || file.file_name || `file-${index}`"
                type="button"
                class="knowledge-recall-detail__file-card"
                :class="{
                  'knowledge-recall-detail__file-card--loading':
                    openingSourceFileKey === getSourceFileKey(file, index),
                }"
                :title="t('knowledge.openFilePreview')"
                :aria-label="t('knowledge.openFilePreview')"
                @click="handleOpenSourceFile(file, index)"
                @keydown.enter.prevent="handleOpenSourceFile(file, index)"
                @keydown.space.prevent="handleOpenSourceFile(file, index)"
              >
                <div class="flex min-w-0 items-start gap-2">
                  <FileTextOutlined class="mt-0.5 shrink-0 text-primary" />
                  <div class="min-w-0">
                    <div class="wrap-break-word text-sm font-medium text-(--color-text-base)">
                      {{ getSourceFileName(file) }}
                    </div>
                    <div class="mt-1 text-xs text-(--color-text-tertiary)">
                      {{ getSourceFileMeta(file) }}
                    </div>
                  </div>
                </div>
              </button>
            </div>
            <div v-else class="knowledge-recall-detail__files-empty">
              <a-empty :description="t('knowledge.recall.noRelatedFiles')" />
            </div>
          </section>
        </aside>
      </div>
    </div>

    <template #footer>
      <a-button @click="handleCloseDetail">{{ t('common.close') }}</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { message } from 'ant-design-vue'
import { BarChartOutlined, FileTextOutlined, LinkOutlined } from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import type { FileSource } from '@/types/knowledge'
import { getCardTypeConfig } from '@/types/knowledge'
import type { KnowledgeRecallViewSource } from '@/types/knowledgeRecall'
import { formatFileSize } from '@/utils/formatFileSize'
import { openFilePreview } from '@/utils/fileType'
import { renderMarkdownSafe } from '@/utils/renderMarkdownSafe'

const props = defineProps<{
  open: boolean
  source: KnowledgeRecallViewSource | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { t, locale } = useI18n()
const getLocalizedCardTypeConfig = (type: string) => getCardTypeConfig(type, locale.value)

const modelOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})
const openingSourceFileKey = ref<string | null>(null)

const detailTitle = computed(() => props.source?.title || '-')
const detailCardId = computed(() => props.source?.cardId || '-')
const detailCardType = computed(() => props.source?.cardType || 'rule')
const detailUpdatedAt = computed(() => {
  const raw = props.source?.updatedAt
  if (!raw) return '-'
  const value = dayjs(raw)
  return value.isValid() ? value.format('YYYY-MM-DD HH:mm:ss') : raw
})
const detailMarkdown = computed(() => props.source?.mdContent ?? '')
const hasDetailMarkdown = computed(() => detailMarkdown.value.trim() !== '')
const detailMarkdownHtml = computed(() => renderMarkdownSafe(detailMarkdown.value))
const detailUsesPreviewContent = computed(() => props.source?.previewContentFallback === true)
const selectedRecallScore = computed(() => {
  const raw = props.source?.score
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : 0
})
const selectedRecallScoreText = computed(() => selectedRecallScore.value.toFixed(2))
const selectedRecallScorePercent = computed(() => {
  const value = Math.min(1, Math.max(0, selectedRecallScore.value))
  return `${Math.round(value * 100)}%`
})
const detailSourceFiles = computed<FileSource[]>(() => props.source?.sourceFiles ?? [])

function handleCloseDetail() {
  modelOpen.value = false
}

function getSourceFileName(file: FileSource) {
  return file.name || file.file_name || file.id || '-'
}

function getSourceFileKey(file: FileSource, index: number) {
  return (
    file.id || file.storage_url || file.parsed_file_url || file.name || file.file_name || `${index}`
  )
}

function getSourceFilePreviewUrl(file: FileSource) {
  return file.parsed_file_url || file.storage_url || ''
}

function openSourceFileByUrl(file: FileSource) {
  const url = getSourceFilePreviewUrl(file)
  if (!url) return false
  openFilePreview(url, getSourceFileName(file))
  return true
}

function handleOpenSourceFile(file: FileSource, index: number) {
  const key = getSourceFileKey(file, index)
  if (openingSourceFileKey.value === key) return

  openingSourceFileKey.value = key
  try {
    if (openSourceFileByUrl(file)) return
    message.warning(t('knowledge.previewNoUrlHint'))
  } finally {
    openingSourceFileKey.value = null
  }
}

function getSourceFileMeta(file: FileSource) {
  const parts: string[] = []
  if (typeof file.file_size === 'number' && file.file_size >= 0) {
    parts.push(formatFileSize(file.file_size))
  }
  if (file.page_hint) parts.push(file.page_hint)
  return parts.length > 0 ? parts.join(' · ') : '-'
}
</script>

<style scoped lang="scss">
.knowledge-recall-detail {
  background: var(--color-bg-container);
}

.knowledge-recall-detail__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 288px;
  max-height: min(680px, calc(100vh - 220px));
  border-top: 1px solid var(--color-border);
}

.knowledge-recall-detail__content {
  min-width: 0;
  padding: 1.5rem 1.75rem;
  overflow: hidden;
}

.knowledge-recall-detail__markdown {
  max-height: min(620px, calc(100vh - 280px));
  overflow-y: auto;
  overflow-wrap: break-word;
  background: transparent;
  color: var(--color-text-base);
  font-size: 14px;
  line-height: 1.75;
}

.knowledge-recall-detail__markdown :deep(h1),
.knowledge-recall-detail__markdown :deep(h2),
.knowledge-recall-detail__markdown :deep(h3) {
  color: var(--color-text-base);
}

.knowledge-recall-detail__markdown :deep(h1:first-child) {
  margin-top: 0;
}

.knowledge-recall-detail__markdown :deep(p:last-child),
.knowledge-recall-detail__markdown :deep(ul:last-child),
.knowledge-recall-detail__markdown :deep(ol:last-child) {
  margin-bottom: 0;
}

.knowledge-recall-detail__markdown :deep(pre) {
  overflow: auto;
}

.knowledge-recall-detail__empty {
  display: flex;
  min-height: min(620px, calc(100vh - 280px));
  align-items: center;
  justify-content: center;
}

.knowledge-recall-detail__aside {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1.5rem;
  border-left: 1px solid var(--color-border);
  background: var(--color-bg-base);
  padding: 1.5rem;
}

.knowledge-recall-detail__files {
  display: flex;
  max-height: min(300px, calc(100vh - 520px));
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  padding-right: 0.25rem;
  scrollbar-gutter: stable;
}

.knowledge-recall-detail__file-card {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;
  background: var(--color-bg-container);
  padding: 0.75rem;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.knowledge-recall-detail__file-card:hover,
.knowledge-recall-detail__file-card:focus-visible {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 12%, transparent);
  outline: 0;
}

.knowledge-recall-detail__file-card--loading {
  cursor: progress;
  opacity: 0.72;
}

.knowledge-recall-detail__files-empty {
  display: flex;
  min-height: min(300px, calc(100vh - 520px));
  align-items: center;
  justify-content: center;
}

@media (max-width: 900px) {
  .knowledge-recall-detail__body {
    grid-template-columns: minmax(0, 1fr);
  }

  .knowledge-recall-detail__aside {
    border-top: 1px solid var(--color-border);
    border-left: 0;
  }
}
</style>
