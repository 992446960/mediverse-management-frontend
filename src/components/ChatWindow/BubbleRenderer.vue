<script setup lang="ts">
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import { CopyOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { renderMarkdownSafe } from '@/utils/renderMarkdownSafe'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    content: string
    /** 为 false 时由父组件在气泡下方单独渲染复制按钮（如 SearchResultThread） */
    showCopyButton?: boolean
  }>(),
  { showCopyButton: true }
)

function escapeCodeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

marked.use({
  renderer: {
    code({ text, lang }) {
      try {
        const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
        const highlighted = hljs.highlight(text, { language }).value
        const langClass = lang ? `language-${lang}` : 'language-plaintext'
        return `<pre><code class="hljs ${langClass}">${highlighted}</code></pre>\n`
      } catch {
        return `<pre><code>${escapeCodeHtml(text)}</code></pre>\n`
      }
    },
  },
})

const renderedContent = computed(() => renderMarkdownSafe(props.content))

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
