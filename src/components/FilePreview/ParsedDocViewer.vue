<template>
  <div class="parsed-doc-viewer flex h-full min-h-0 flex-row gap-3 bg-white dark:bg-slate-900">
    <MarkdownTocPanel
      v-if="!loading && !error && toc.length > 0"
      :items="toc"
      @jump="jumpToHeading"
    />
    <div class="min-h-0 min-w-0 flex-1 overflow-auto p-6">
      <a-spin v-if="loading" class="w-full py-12" />
      <a-empty v-else-if="error" :description="error" />
      <!-- eslint-disable vue/no-v-html -- 解析后的 Markdown，来源受控 -->
      <div
        v-else
        ref="contentRef"
        class="prose prose-slate max-w-none dark:prose-invert prose-p:text-slate-600 prose-li:text-slate-600 dark:prose-p:text-slate-300 dark:prose-li:text-slate-300"
        v-html="renderedHtml"
      />
      <!-- eslint-enable vue/no-v-html -->
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
  parsedFileUrl: string | null | undefined
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const renderedHtml = ref('')
const toc = ref<MarkdownTocItem[]>([])
const contentRef = ref<HTMLElement | null>(null)

function jumpToHeading(id: string) {
  const root = contentRef.value
  if (!root) return
  const el = root.querySelector(`#${CSS.escape(id)}`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function fetchAndRender() {
  if (!props.parsedFileUrl) {
    renderedHtml.value = ''
    toc.value = []
    error.value = t('knowledge.noParsedDoc')
    return
  }
  loading.value = true
  error.value = null
  try {
    const res = await fetch(props.parsedFileUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    const { html, toc: headings } = renderMarkdownWithHeadingIds(text)
    renderedHtml.value = html
    toc.value = headings
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('knowledge.loadParsedDocFailed')
    renderedHtml.value = ''
    toc.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => props.parsedFileUrl,
  () => fetchAndRender(),
  { immediate: true }
)
</script>
