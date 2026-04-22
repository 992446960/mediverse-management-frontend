<template>
  <div class="stat-card">
    <a-spin :spinning="loading">
      <div class="stat-card__inner">
        <div class="stat-card__head">
          <span class="stat-card__title">{{ title }}</span>
          <component :is="icon" v-if="icon" class="stat-card__icon" :style="{ color: iconColor }" />
        </div>
        <div class="stat-card__value" :style="{ color: valueColor }">
          {{ displayValue }}
        </div>
      </div>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    value: string | number
    icon?: Component
    /** 图标颜色，如 var(--color-primary) */
    iconColor?: string
    /** 数值颜色，默认继承正文 */
    valueColor?: string
    loading?: boolean
  }>(),
  {
    icon: undefined,
    iconColor: 'var(--color-text-secondary)',
    valueColor: 'var(--color-text-base)',
    loading: false,
  }
)

const displayValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString()
  }
  return props.value
})
</script>

<style scoped lang="scss">
.stat-card {
  height: 100%;
  padding: var(--spacing-md);
  background: var(--color-bg-container);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-lg);
}

.stat-card__inner {
  min-height: 5rem;
}

.stat-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.stat-card__title {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.stat-card__icon {
  flex-shrink: 0;
  font-size: 1.25rem;
}

.stat-card__value {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.2;
  word-break: break-word;
}
</style>
