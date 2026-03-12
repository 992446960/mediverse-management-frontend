<template>
  <div class="text-file-viewer h-full overflow-auto bg-white dark:bg-slate-900 p-6">
    <a-spin v-if="loading" class="w-full py-12" />
    <a-empty v-else-if="error" :description="error" />
    <div
      v-else-if="useMarkdown"
      class="prose prose-slate dark:prose-invert max-w-none"
      v-html="renderedHtml"
    />
    <pre
      v-else
      class="text-sm overflow-x-auto p-4 bg-slate-50 dark:bg-slate-800 rounded"
    ><code>{{ rawContent }}</code></pre>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  fileUrl: string
  fileType: string
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const rawContent = ref('')

const useMarkdown = computed(() => props.fileType.toLowerCase() === 'md')

const renderedHtml = computed(() => {
  if (!useMarkdown.value || !rawContent.value) return ''
  return marked.parse(rawContent.value, { async: false }) as string
})

async function fetchContent() {
  if (!props.fileUrl) {
    rawContent.value = ''
    error.value = '暂无预览地址'
    return
  }
  loading.value = true
  error.value = null
  try {
    const res = await fetch(props.fileUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    rawContent.value = await res.text()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载文件失败'
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
