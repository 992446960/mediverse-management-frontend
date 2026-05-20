<template>
  <div>
    <div class="grid grid-cols-2 gap-4">
      <JsonContentPane :json-content="jsonContent" />
      <div>
        <div class="text-sm font-medium text-gray-500 mb-2">
          {{ t('knowledge.card.markdownPane') }}
        </div>
        <div
          class="markdown-content-pane__body p-4 bg-gray-50 rounded-lg min-h-[200px] h-[min(480px,calc(100vh-240px))] overflow-y-auto"
        >
          <!-- eslint-disable-next-line vue/no-v-html -- marked + DOMPurify -->
          <div v-if="hasMarkdownContent" class="markdown-body" v-html="renderedContent"></div>
          <a-empty
            v-else
            :description="t('knowledge.card.markdownEmpty')"
            :image="Empty.PRESENTED_IMAGE_SIMPLE"
          />
        </div>
      </div>
    </div>
    <div v-if="tags?.length" class="mt-4">
      <div class="mb-3 text-sm font-semibold text-(--color-text-base)">
        {{ t('knowledge.card.tagsLabel') }}
      </div>
      <div class="flex flex-wrap gap-1.5">
        <a-tag v-for="tag in tags" :key="tag" class="m-0"> #{{ tag }} </a-tag>
      </div>
    </div>
    <div class="mt-6">
      <AssociatedFilesList
        :rows="sourceFileRows"
        :opening-id="openingId"
        @open="emit('open', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Empty } from 'ant-design-vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import 'github-markdown-css/github-markdown-light.css'
import type { KnowledgeCard } from '@/types/knowledge'
import JsonContentPane from './JsonContentPane.vue'
import AssociatedFilesList from './AssociatedFilesList.vue'

export type SourceFileRow = {
  source: KnowledgeCard['source_files'][number]
  thumbKind: 'pdf' | 'doc' | 'xls' | 'ppt' | 'img' | 'txt' | 'default'
  sizeLabel: string
}

const props = defineProps<{
  jsonContent: KnowledgeCard['json_content']
  mdContent: string
  tags?: string[]
  sourceFileRows: SourceFileRow[]
  openingId: string | null
}>()

const emit = defineEmits<{
  (e: 'open', item: KnowledgeCard['source_files'][number]): void
}>()

const { t } = useI18n()

const hasMarkdownContent = computed(() => props.mdContent.trim() !== '')

const renderedContent = computed(() => {
  if (!hasMarkdownContent.value) return ''
  const html = marked.parse(props.mdContent) as string
  return DOMPurify.sanitize(html)
})
</script>

<style scoped>
.markdown-content-pane__body {
  display: flex;
  flex-direction: column;
}

.markdown-content-pane__body :deep(.ant-empty) {
  margin: auto;
}

.markdown-body {
  background-color: transparent;
}
</style>
