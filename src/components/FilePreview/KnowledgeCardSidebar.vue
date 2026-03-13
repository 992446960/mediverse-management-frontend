<template>
  <div class="knowledge-card-sidebar flex flex-col h-full">
    <div class="flex items-center mb-2">
      <BulbOutlined class="text-primary w-5 h-5 mr-2 shrink-0" />
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
import { BulbOutlined, FileTextOutlined } from '@ant-design/icons-vue'
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
  background: var(--color-bg-container);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.knowledge-card-sidebar__card:hover {
  box-shadow: var(--shadow-sm);
}

.knowledge-card-sidebar__card--evidence:hover {
  border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
}

.knowledge-card-sidebar__card--rule:hover {
  border-color: color-mix(in srgb, var(--color-success) 40%, transparent);
}

.knowledge-card-sidebar__card--experience:hover {
  border-color: color-mix(in srgb, var(--color-warning) 40%, transparent);
}

.dark .knowledge-card-sidebar__card {
  background: var(--color-bg-container);
  border-color: var(--color-border);
}

.knowledge-card-sidebar__type-tag {
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.knowledge-card-sidebar__type-tag--evidence {
  background: var(--color-primary-100);
  color: var(--color-primary);
  border: 1px solid color-mix(in srgb, var(--color-primary) 10%, transparent);
}

.knowledge-card-sidebar__type-tag--rule {
  background: color-mix(in srgb, var(--color-success) 10%, white);
  color: var(--color-success);
  border: 1px solid color-mix(in srgb, var(--color-success) 10%, transparent);
}

.knowledge-card-sidebar__type-tag--experience {
  background: color-mix(in srgb, var(--color-warning) 10%, white);
  color: var(--color-warning);
  border: 1px solid color-mix(in srgb, var(--color-warning) 10%, transparent);
}

.knowledge-card-sidebar__desc-tag {
  padding: 2px 6px;
  font-size: 10px;
  color: var(--color-text-secondary);
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-secondary);
  border-radius: 4px;
}

.dark .knowledge-card-sidebar__desc-tag {
  color: var(--color-text-secondary);
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
}

.knowledge-card-sidebar__source {
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border-secondary);
  display: flex;
  align-items: center;
  font-size: 10px;
  color: var(--color-text-tertiary);
}

.dark .knowledge-card-sidebar__source {
  border-top-color: var(--color-border);
  color: var(--color-text-tertiary);
}
</style>
