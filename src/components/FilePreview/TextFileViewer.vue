<template>
  <div class="text-file-viewer flex h-full min-h-0 flex-row gap-3 bg-white dark:bg-slate-900">
    <MarkdownTocPanel
      v-if="!loading && !error && useMarkdown && toc.length > 0"
      :items="toc"
      @jump="jumpToHeading"
    />
    <div class="min-h-0 min-w-0 flex-1 overflow-auto p-6">
      <a-spin v-if="loading" class="w-full py-12" />
      <a-empty v-else-if="error" :description="error" />
      <!-- eslint-disable vue/no-v-html -- Markdown 渲染，来源受控 -->
      <div
        v-else-if="useMarkdown"
        ref="contentRef"
        class="prose prose-slate max-w-none dark:prose-invert"
        v-html="renderedHtmlMd"
      />
      <!-- eslint-enable vue/no-v-html -->
      <pre
        v-else
        class="overflow-x-auto rounded bg-slate-50 p-4 text-sm dark:bg-slate-800"
      ><code>{{ rawContent }}</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import MarkdownTocPanel from '@/components/FilePreview/MarkdownTocPanel.vue'
import { renderMarkdownWithHeadingIds } from '@/utils/markdownToc'
import type { MarkdownTocItem } from '@/utils/markdownToc'

const { t } = useI18n()

const props = defineProps<{
  fileUrl: string
  fileType: string
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const rawContent = ref('')
const contentRef = ref<HTMLElement | null>(null)

const useMarkdown = computed(() => props.fileType.toLowerCase() === 'md')

const toc = ref<MarkdownTocItem[]>([])
const renderedHtmlMd = ref('')

function jumpToHeading(id: string) {
  const root = contentRef.value
  if (!root) return
  const el = root.querySelector(`#${CSS.escape(id)}`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function applyMarkdown() {
  if (!useMarkdown.value || !rawContent.value) {
    renderedHtmlMd.value = ''
    toc.value = []
    return
  }
  const { html, toc: headings } = renderMarkdownWithHeadingIds(rawContent.value)
  renderedHtmlMd.value = html
  toc.value = headings
}

watch(
  () => [rawContent.value, useMarkdown.value] as const,
  () => applyMarkdown(),
  { immediate: true }
)

async function fetchContent() {
  if (!props.fileUrl) {
    rawContent.value = ''
    error.value = t('knowledge.noPreviewUrl')
    return
  }
  loading.value = true
  error.value = null
  try {
    const res = await fetch(props.fileUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    rawContent.value = await res.text()
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('knowledge.loadFileFailed')
    rawContent.value = ''
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.fileUrl, props.fileType],
  () => fetchContent(),
  { immediate: true }
)
</script>
