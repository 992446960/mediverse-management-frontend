<script setup lang="ts">
import { Popover } from 'ant-design-vue'
import { LinkOutlined, FileTextOutlined } from '@ant-design/icons-vue'
import type { SourceCitation } from '@/types/chat'

defineProps<{
  citations: SourceCitation[]
}>()
</script>

<template>
  <div v-if="citations && citations.length > 0" class="source-citation mt-2">
    <div class="flex flex-wrap gap-2">
      <Popover
        v-for="(citation, index) in citations"
        :key="citation.id"
        :title="citation.title"
        trigger="hover"
      >
        <template #content>
          <div class="max-w-xs">
            <p v-if="citation.content_snippet" class="text-xs text-gray-500 mb-2">
              {{ citation.content_snippet }}
            </p>
            <a
              v-if="citation.url"
              :href="citation.url"
              target="_blank"
              class="text-blue-500 text-xs flex items-center gap-1"
            >
              <LinkOutlined /> 查看原文
            </a>
          </div>
        </template>
        <div
          class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <FileTextOutlined />
          <span class="truncate max-w-[150px]">{{ citation.title }}</span>
          <span class="text-gray-400">[{{ index + 1 }}]</span>
        </div>
      </Popover>
    </div>
  </div>
</template>

<style scoped>
.source-citation {
  font-size: 12px;
}
</style>
