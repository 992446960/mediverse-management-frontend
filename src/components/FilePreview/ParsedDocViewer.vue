<template>
  <div class="parsed-doc-viewer h-full overflow-auto bg-white dark:bg-slate-900 p-6">
    <a-spin v-if="loading" class="w-full py-12" />
    <a-empty v-else-if="error" :description="error" />
    <div
      v-else
      class="prose prose-slate dark:prose-invert max-w-none prose-p:text-slate-600 prose-li:text-slate-600 dark:prose-p:text-slate-300 dark:prose-li:text-slate-300"
      v-html="renderedHtml"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  parsedFileUrl: string | null | undefined
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const renderedHtml = ref('')

async function fetchAndRender() {
  if (!props.parsedFileUrl) {
    renderedHtml.value = ''
    error.value = '暂无解析后文档'
    return
  }
  loading.value = true
  error.value = null
  try {
    const res = await fetch(props.parsedFileUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    renderedHtml.value = marked.parse(text, { async: false }) as string
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载解析文档失败'
    renderedHtml.value = ''
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
