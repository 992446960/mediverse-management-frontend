<template>
  <div class="knowledge-card-preview" :class="`knowledge-card-preview--${resolvedType}`">
    <div class="flex items-center justify-between gap-2">
      <h4
        class="knowledge-card-preview__title m-0 min-w-0 flex-1 text-[15px] font-bold leading-tight text-slate-800 dark:text-slate-100"
        :title="fullTitle"
      >
        <span v-if="titlePrefix">{{ titlePrefix }}</span
        >{{ title }}
      </h4>
      <span
        class="knowledge-card-preview__type-tag shrink-0"
        :class="`knowledge-card-preview__type-tag--${resolvedType}`"
      >
        {{ typeLabel }}
      </span>
    </div>
    <div v-if="tags?.length" class="flex flex-wrap gap-1.5">
      <span v-for="tag in tags" :key="tag" class="knowledge-card-preview__desc-tag">
        #{{ tag }}
      </span>
    </div>
    <div v-if="$slots.default" class="knowledge-card-preview__body">
      <slot />
    </div>
    <div v-if="sourceFileName" class="knowledge-card-preview__source">
      <FileTextOutlined class="mr-1 h-3 w-3 shrink-0 opacity-70" />
      <span>{{ t('knowledge.card.source') }}{{ sourceFileName }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { FileTextOutlined } from '@ant-design/icons-vue'
import { CARD_TYPE_CONFIG } from '@/types/knowledge'
import type { CardType } from '@/types/knowledge'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    /** 循证 / 规则 / 经验（字符串兼容检索引用等场景） */
    type: CardType | string
    title: string
    tags?: string[]
    /** 来源文件名，展示「来源：xxx」 */
    sourceFileName?: string
    /** 标题前缀，如 `1. ` */
    titlePrefix?: string
  }>(),
  {
    tags: () => [],
  }
)

const CARD_TYPE_LABEL_KEYS: Record<CardType, string> = {
  evidence: 'knowledge.card.typeEvidence',
  rule: 'knowledge.card.typeRule',
  experience: 'knowledge.card.typeExperience',
}

const resolvedType = computed<CardType>(() => {
  const raw = props.type
  if (typeof raw === 'string' && raw in CARD_TYPE_CONFIG) {
    return raw as CardType
  }
  return 'evidence'
})

const typeLabel = computed(() => {
  const raw = props.type
  if (typeof raw === 'string' && raw in CARD_TYPE_LABEL_KEYS) {
    return t(CARD_TYPE_LABEL_KEYS[raw as CardType])
  }
  return typeof raw === 'string' ? raw.toUpperCase() : t('knowledge.card.typeEvidence')
})

const fullTitle = computed(() => `${props.titlePrefix ?? ''}${props.title}`)
</script>

<style scoped>
.knowledge-card-preview {
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

.knowledge-card-preview:hover {
  box-shadow: var(--shadow-sm);
}

.knowledge-card-preview--evidence:hover {
  border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
}

.knowledge-card-preview--rule:hover {
  border-color: color-mix(in srgb, var(--color-success) 40%, transparent);
}

.knowledge-card-preview--experience:hover {
  border-color: color-mix(in srgb, var(--color-warning) 40%, transparent);
}

.dark .knowledge-card-preview {
  background: var(--color-bg-container);
  border-color: var(--color-border);
}

.knowledge-card-preview__type-tag {
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.knowledge-card-preview__type-tag--evidence {
  background: var(--color-primary-100);
  color: var(--color-primary);
  border: 1px solid color-mix(in srgb, var(--color-primary) 10%, transparent);
}

.knowledge-card-preview__type-tag--rule {
  background: color-mix(in srgb, var(--color-success) 10%, white);
  color: var(--color-success);
  border: 1px solid color-mix(in srgb, var(--color-success) 10%, transparent);
}

.knowledge-card-preview__type-tag--experience {
  background: color-mix(in srgb, var(--color-warning) 10%, white);
  color: var(--color-warning);
  border: 1px solid color-mix(in srgb, var(--color-warning) 10%, transparent);
}

.knowledge-card-preview__desc-tag {
  padding: 2px 6px;
  font-size: 10px;
  color: var(--color-text-secondary);
  background: var(--color-bg-base);
  border: 1px solid var(--color-border-secondary);
  border-radius: 4px;
}

.dark .knowledge-card-preview__desc-tag {
  color: var(--color-text-secondary);
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
}

.knowledge-card-preview__body :deep(*) {
  max-width: 100%;
}

.knowledge-card-preview__source {
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border-secondary);
  display: flex;
  align-items: center;
  font-size: 10px;
  color: var(--color-text-tertiary);
}

.dark .knowledge-card-preview__source {
  border-top-color: var(--color-border);
  color: var(--color-text-tertiary);
}
</style>
