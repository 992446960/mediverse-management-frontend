<script setup lang="ts">
import { computed } from 'vue'
import { sanitizeKnowledgePreviewHtml } from '@/utils/sanitizeKnowledgePreviewHtml'

const props = defineProps<{
  content: string
  /** 知识库列表卡片：紧凑 + 行数截断 */
  variant: 'card' | 'skill' | 'modal'
}>()

const html = computed(() => sanitizeKnowledgePreviewHtml(props.content))

const rootClass = computed(() => {
  const base = 'citation-preview-html markdown-body prose prose-sm max-w-none dark:prose-invert'
  if (props.variant === 'card') {
    return `${base} citation-preview-html--card text-xs text-gray-600 leading-relaxed mb-0 flex-1 min-w-0 line-clamp-3`
  }
  if (props.variant === 'skill') {
    return `${base} citation-preview-html--skill text-xs text-gray-500 dark:text-gray-400 line-clamp-3`
  }
  return `${base} citation-preview-html--modal text-gray-600`
})
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div :class="rootClass" v-html="html" />
</template>

<style scoped>
.citation-preview-html--card :deep(p:last-child),
.citation-preview-html--skill :deep(p:last-child) {
  margin-bottom: 0;
}

.citation-preview-html--card :deep(p + p),
.citation-preview-html--skill :deep(p + p) {
  margin-top: 0.25em;
}

.citation-preview-html--modal :deep(p:last-child) {
  margin-bottom: 0;
}
</style>
