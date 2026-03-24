<template>
  <div class="knowledge-card-sidebar flex flex-col h-full">
    <div class="mb-2 flex items-center">
      <BulbOutlined class="mr-2 h-5 w-5 shrink-0 text-primary" />
      <h3 class="m-0 text-base font-semibold text-slate-800 dark:text-slate-100">
        {{ t('knowledge.card.extractedCards', { count: cards.length }) }}
      </h3>
    </div>
    <div class="flex-1 space-y-4 overflow-y-auto">
      <KnowledgeCardPreview
        v-for="card in cards"
        :key="card.id"
        :type="card.type"
        :title="card.title"
        :tags="card.tags"
        :source-file-name="sourceFileName"
      />
      <a-empty v-if="!loading && cards.length === 0" :description="t('knowledge.card.noCards')" />
      <a-spin v-if="loading" class="w-full py-8" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { BulbOutlined } from '@ant-design/icons-vue'
import KnowledgeCardPreview from '@/components/KnowledgeCardPreview/index.vue'
import type { FileCard } from '@/types/knowledge'

const { t } = useI18n()

defineProps<{
  cards: FileCard[]
  sourceFileName?: string
  loading?: boolean
}>()
</script>
