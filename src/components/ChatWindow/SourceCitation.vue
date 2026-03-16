<template>
  <div
    v-if="citations && citations.length > 0"
    class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800"
  >
    <div class="flex items-center gap-2 mb-2 text-xs text-gray-500 font-medium">
      <LinkOutlined />
      <span>参考来源</span>
    </div>
    <div class="flex flex-wrap gap-2">
      <div
        v-for="(citation, index) in citations"
        :key="citation.id || index"
        class="flex items-center gap-1 px-2 py-1 text-xs bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-gray-700 dark:hover:border-gray-600 transition-colors"
        @click="handleClick(citation)"
      >
        <span
          class="w-4 h-4 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full text-[10px] font-bold text-gray-600 dark:text-gray-300"
        >
          {{ index + 1 }}
        </span>
        <span class="truncate max-w-[150px]" :title="citation.title">{{ citation.title }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LinkOutlined } from '@ant-design/icons-vue'
import type { SourceCitation } from '@/types/chat'
import { Modal } from 'ant-design-vue'

const props = defineProps<{
  citations: SourceCitation[]
}>()

// Use props
console.log(props)

const handleClick = (citation: SourceCitation) => {
  Modal.info({
    title: citation.title,
    content: citation.content_snippet || citation.url || '暂无详细内容',
    width: 600,
    maskClosable: true,
  })
}
</script>
