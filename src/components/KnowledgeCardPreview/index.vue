<template>
  <div class="knowledge-card-preview" :style="containerStyle">
    <div class="flex items-center justify-between gap-2">
      <h4
        class="knowledge-card-preview__title m-0 min-w-0 flex-1 text-[15px] font-bold leading-tight text-slate-800 dark:text-slate-100"
        :title="fullTitle"
      >
        <span v-if="titlePrefix">{{ titlePrefix }}</span
        >{{ title }}
      </h4>
      <!-- 动态颜色：由 getCardTypeConfig 驱动，兼容后端任意新增类型 -->
      <a-tag
        v-if="showTypeTag"
        :color="typeConfig.color"
        class="shrink-0 m-0 text-[10px] font-bold"
      >
        {{ typeConfig.label }}
      </a-tag>
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
import { getCardTypeConfig } from '@/types/knowledge'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    /** 知识卡类型 code，由后端动态下发（兼容任意字符串） */
    type: string
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

/** 类型配置：颜色 + label，未知类型自动 fallback */
const normalizedType = computed(() => props.type.trim())
const typeConfig = computed(() => getCardTypeConfig(normalizedType.value))
const showTypeTag = computed(() => normalizedType.value !== '')

const HOVER_BORDER_COLOR: Record<string, string> = {
  evidence: 'var(--color-primary)',
  rule: 'var(--color-success)',
  experience: 'var(--color-warning)',
  scale: '#722ed1',
  risk_point: '#ff4d4f',
  pathway_clause: '#13c2c2',
  melody_element: '#2f54eb',
}

const containerStyle = computed(() => ({
  '--knowledge-card-hover-border-color':
    HOVER_BORDER_COLOR[normalizedType.value] ?? 'var(--color-text-secondary)',
}))

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
  border-color: color-mix(
    in srgb,
    var(--knowledge-card-hover-border-color, var(--color-text-secondary)) 40%,
    transparent
  );
  box-shadow: var(--shadow-sm);
}

.dark .knowledge-card-preview {
  background: var(--color-bg-container);
  border-color: var(--color-border);
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
