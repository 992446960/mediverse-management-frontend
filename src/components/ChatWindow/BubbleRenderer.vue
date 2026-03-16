<script setup lang="ts">
import { computed, h } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import { CopyOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const props = defineProps<{
  content: string
}>()

// Configure marked with highlight.js
marked.setOptions({
  highlight: function (code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(code, { language }).value
  },
  langPrefix: 'hljs language-',
})

const renderedContent = computed(() => {
  const rawHtml = marked.parse(props.content || '') as string
  return DOMPurify.sanitize(rawHtml)
})

const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(props.content)
    message.success('已复制')
  } catch {
    message.error('复制失败')
  }
}
</script>

<template>
  <div class="bubble-renderer group relative">
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div
      class="markdown-body prose prose-sm max-w-none dark:prose-invert"
      v-html="renderedContent"
    ></div>

    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <a-button type="text" size="small" :icon="h(CopyOutlined)" @click="copyContent" />
    </div>
  </div>
</template>

<style scoped>
.markdown-body :deep(pre) {
  background-color: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow: auto;
}

.dark .markdown-body :deep(pre) {
  background-color: #161b22;
}
</style>
