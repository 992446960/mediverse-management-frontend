<template>
  <div class="knowledge-card-sidebar flex flex-col h-full">
    <div class="flex items-center mb-2">
      <FolderOutlined class="text-primary w-5 h-5 mr-2 shrink-0" />
      <h3 class="text-base font-semibold text-slate-800 dark:text-slate-100 m-0">
        抽取知识卡 ({{ cards.length }})
      </h3>
    </div>
    <div class="flex-1 overflow-y-auto space-y-4">
      <div
        v-for="card in cards"
        :key="card.id"
        class="knowledge-card-sidebar__card"
        :class="`knowledge-card-sidebar__card--${card.type}`"
      >
        <div class="flex items-center justify-between gap-2">
          <h4
            class="text-[15px] font-bold text-slate-800 dark:text-slate-100 leading-tight min-w-0 flex-1"
          >
            {{ card.title }}
          </h4>
          <span
            class="knowledge-card-sidebar__type-tag shrink-0"
            :class="`knowledge-card-sidebar__type-tag--${card.type}`"
          >
            {{ getTypeLabel(card.type) }}
          </span>
        </div>
        <div v-if="card.tags?.length" class="flex flex-wrap gap-1.5">
          <span v-for="tag in card.tags" :key="tag" class="knowledge-card-sidebar__desc-tag">
            #{{ tag }}
          </span>
        </div>
        <div v-if="sourceFileName" class="knowledge-card-sidebar__source">
          <FileTextOutlined class="w-3 h-3 mr-1 shrink-0 opacity-70" />
          <span>来源：{{ sourceFileName }}</span>
        </div>
      </div>
      <a-empty v-if="!loading && cards.length === 0" description="暂无知识卡" />
      <a-spin v-if="loading" class="w-full py-8" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { FolderOutlined, FileTextOutlined } from '@ant-design/icons-vue'
import type { FileCard, CardType } from '@/types/knowledge'

const CARD_TYPE_LABELS: Record<CardType, string> = {
  evidence: '循证卡',
  rule: '规则卡',
  experience: '经验卡',
}

defineProps<{
  cards: FileCard[]
  sourceFileName?: string
  loading?: boolean
}>()

function getTypeLabel(type: CardType): string {
  return CARD_TYPE_LABELS[type] ?? type
}
</script>

<style scoped>
.knowledge-card-sidebar__card {
  padding: 1.25rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.knowledge-card-sidebar__card:hover {
  box-shadow:
    0 1px 3px 0 rgb(0 0 0 / 0.1),
    0 1px 2px -1px rgb(0 0 0 / 0.06);
}

.knowledge-card-sidebar__card--evidence:hover {
  border-color: rgb(14 165 233 / 0.4);
}

.knowledge-card-sidebar__card--rule:hover {
  border-color: rgb(34 197 94 / 0.4);
}

.knowledge-card-sidebar__card--experience:hover {
  border-color: rgb(249 115 22 / 0.4);
}

.dark .knowledge-card-sidebar__card {
  background: var(--color-bg-container, #1f2937);
  border-color: rgba(255, 255, 255, 0.08);
}

.knowledge-card-sidebar__type-tag {
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
  border-radius: 9999px;
  white-space: nowrap;
}

.knowledge-card-sidebar__type-tag--evidence {
  background: rgb(224 242 254);
  color: #0ea5e9;
  border: 1px solid rgb(14 165 233 / 0.1);
}

.knowledge-card-sidebar__type-tag--rule {
  background: rgb(220 252 231);
  color: #16a34a;
  border: 1px solid rgb(34 197 94 / 0.1);
}

.knowledge-card-sidebar__type-tag--experience {
  background: rgb(255 237 213);
  color: #ea580c;
  border: 1px solid rgb(249 115 22 / 0.1);
}

.knowledge-card-sidebar__desc-tag {
  padding: 2px 6px;
  font-size: 10px;
  color: #64748b;
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  border-radius: 4px;
}

.dark .knowledge-card-sidebar__desc-tag {
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
}

.knowledge-card-sidebar__source {
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  font-size: 10px;
  color: #94a3b8;
}

.dark .knowledge-card-sidebar__source {
  border-top-color: rgba(255, 255, 255, 0.08);
  color: #94a3b8;
}
</style>
