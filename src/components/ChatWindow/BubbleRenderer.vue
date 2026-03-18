<script setup lang="ts">
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import { CopyOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    content: string
    /** 为 false 时由父组件在气泡下方单独渲染复制按钮（如 SearchResultThread） */
    showCopyButton?: boolean
  }>(),
  { showCopyButton: true }
)

marked.setOptions({
  highlight: function (code, lang) {
    try {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    } catch {
      return code
    }
  },
  langPrefix: 'hljs language-',
})

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

const renderedContent = computed(() => {
  const raw = String(props.content ?? '')
  if (!raw.trim()) return ''
  try {
    const result = marked.parse(raw)
    const html = typeof result === 'string' ? result : String(result)
    return DOMPurify.sanitize(html)
  } catch {
    return DOMPurify.sanitize(escapeHtml(raw))
  }
})

const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(props.content)
    message.success(t('common.copied'))
  } catch {
    message.error(t('common.copyFailed'))
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

    <div
      v-if="showCopyButton"
      class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
    >
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
