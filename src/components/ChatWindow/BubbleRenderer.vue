<template>
  <div
    class="bubble-renderer prose prose-sm max-w-none"
    @click="handleClick"
    v-html="renderedContent"
  ></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

const props = defineProps<{
  content: string
}>()

const emit = defineEmits(['citation-click'])

const renderedContent = computed(() => {
  let rawHtml = marked.parse(props.content || '', {
    highlight: function (code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    },
    langPrefix: 'hljs language-',
  })

  // Replace [n] with <sup ...>
  // Note: This regex assumes simple [1], [2] format.
  rawHtml = (rawHtml as string).replace(
    /\[(\d+)\]/g,
    '<sup class="citation-ref cursor-pointer text-blue-600 hover:underline" data-index="$1">[$1]</sup>'
  )

  return DOMPurify.sanitize(rawHtml as string, {
    ADD_ATTR: ['target', 'data-index', 'class'],
  })
})

const handleClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (target.classList.contains('citation-ref')) {
    const index = target.getAttribute('data-index')
    if (index) {
      emit('citation-click', parseInt(index, 10))
    }
  }
}
</script>

<style scoped>
.bubble-renderer :deep(pre) {
  background-color: #f6f8fa;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
}

.bubble-renderer :deep(.citation-ref) {
  user-select: none;
}
</style>
