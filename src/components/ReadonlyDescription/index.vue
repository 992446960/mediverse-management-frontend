<template>
  <dl class="readonly-description" :class="{ 'readonly-description--single': columns === 1 }">
    <div
      v-for="row in rows"
      :key="row.key"
      class="readonly-description__row"
      :class="[
        `readonly-description__row--${row.placement}`,
        { 'readonly-description__row--last': row.isLastRow },
      ]"
    >
      <dt class="readonly-description__label">{{ row.item.label }}</dt>
      <dd class="readonly-description__value">
        <a-space v-if="isTagList(row.item.value)" wrap :size="[4, 4]">
          <a-tag v-for="tag in row.item.value" :key="tag">{{ tag }}</a-tag>
        </a-space>
        <span v-else>{{ getDisplayValue(row.item.value) }}</span>
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

type RowPlacement = 'left' | 'right' | 'wide'

const props = withDefaults(
  defineProps<{
    items: ReadonlyDescriptionItem[]
    columns?: 1 | 2
    emptyText?: string
  }>(),
  {
    columns: 2,
    emptyText: '—',
  }
)

const rows = computed(() => {
  let column: 0 | 1 = 0
  let visualRow = 0
  const draft = props.items.map((item, index) => {
    if (props.columns === 1 || item.span === 2) {
      if (column === 1) {
        visualRow += 1
        column = 0
      }
      const row = {
        item,
        key: `${item.label}-${index}`,
        placement: 'wide' as RowPlacement,
        visualRow,
      }
      visualRow += 1
      column = 0
      return row
    }

    const placement: RowPlacement = column === 0 ? 'left' : 'right'
    const row = {
      item,
      key: `${item.label}-${index}`,
      placement,
      visualRow,
    }
    if (column === 1) {
      visualRow += 1
      column = 0
    } else {
      column = 1
    }
    return row
  })
  const lastVisualRow = Math.max(...draft.map((row) => row.visualRow), 0)

  return draft.map((row) => ({
    ...row,
    isLastRow: row.visualRow === lastVisualRow,
  }))
})

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
  gap: 0;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-container);
  margin: 0;
}

.readonly-description--single {
  grid-template-columns: 1fr;
}

.readonly-description__row {
  display: grid;
  grid-template-columns: minmax(6.5rem, 34%) minmax(0, 1fr);
  min-width: 0;
  border-bottom: 1px solid var(--color-border-secondary);
}

.readonly-description__row--left {
  border-right: 1px solid var(--color-border-secondary);
}

.readonly-description--single .readonly-description__row--left {
  border-right: 0;
}

.readonly-description__row--last {
  border-bottom: 0;
}

.readonly-description__row--wide {
  grid-column: span 2;
}

.readonly-description--single .readonly-description__row--wide {
  grid-column: span 1;
}

.readonly-description__label {
  display: flex;
  min-width: 0;
  align-items: center;
  padding: 10px 12px;
  margin: 0;
  background: var(--color-bg-layout);
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  line-height: 1.4;
  word-break: break-word;
}

.readonly-description__value {
  min-width: 0;
  min-height: 42px;
  padding: 10px 12px;
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

  .readonly-description__row,
  .readonly-description__row--left,
  .readonly-description__row--right,
  .readonly-description__row--wide {
    border-right: 0;
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .readonly-description__row--last,
  .readonly-description__row:last-child {
    border-bottom: 0;
  }

  .readonly-description__row--wide {
    grid-column: span 1;
  }
}
</style>
