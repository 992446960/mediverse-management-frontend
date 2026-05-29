<template>
  <dl class="readonly-description">
    <div
      v-for="(item, index) in items"
      :key="`${item.label}-${index}`"
      class="readonly-description__item"
      :class="{ 'readonly-description__item--wide': item.span === 2 }"
    >
      <dt class="readonly-description__label">{{ item.label }}</dt>
      <dd class="readonly-description__value">
        <a-space v-if="isTagList(item.value)" wrap :size="[4, 4]">
          <a-tag v-for="tag in item.value" :key="tag">{{ tag }}</a-tag>
        </a-space>
        <span v-else>{{ getDisplayValue(item.value) }}</span>
      </dd>
    </div>
  </dl>
</template>

<script setup lang="ts">
interface ReadonlyDescriptionItem {
  label: string
  value?: string | number | string[] | null
  span?: 1 | 2
}

const props = withDefaults(
  defineProps<{
    items: ReadonlyDescriptionItem[]
    emptyText?: string
  }>(),
  {
    emptyText: '—',
  }
)

function isTagList(value: ReadonlyDescriptionItem['value']): value is string[] {
  return Array.isArray(value) && value.length > 0
}

function getDisplayValue(value: ReadonlyDescriptionItem['value']) {
  if (value == null) return props.emptyText
  if (Array.isArray(value)) return value.length > 0 ? value.join('、') : props.emptyText
  if (value === '') return props.emptyText
  return value
}
</script>

<style scoped lang="scss">
.readonly-description {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-md) var(--spacing-lg);
  margin: 0;
}

.readonly-description__item {
  min-width: 0;
}

.readonly-description__item--wide {
  grid-column: span 2;
}

.readonly-description__label {
  margin-bottom: var(--spacing-xs);
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  line-height: 1.4;
}

.readonly-description__value {
  min-height: 1.5rem;
  margin: 0;
  color: var(--color-text-base);
  font-size: 0.875rem;
  line-height: 1.5;
  word-break: break-word;
}

@media (max-width: 640px) {
  .readonly-description {
    grid-template-columns: 1fr;
  }

  .readonly-description__item--wide {
    grid-column: span 1;
  }
}
</style>
