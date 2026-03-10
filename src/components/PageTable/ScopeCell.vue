<template>
  <template v-if="column.scopeType === '_link'">
    <a-button
      type="link"
      size="small"
      class="page-table__cell-link text-primary hover:underline text-sm font-medium cursor-pointer"
      :class="{ 'page-table__cell-link--disabled opacity-50 cursor-not-allowed': column.linkDisabled?.(record) }"
      :disabled="column.linkDisabled?.(record)"
      @click="column.linkFn?.(record)"
    >
      {{ column.formatter?.(record) ?? getCellValue(record) }}
    </a-button>
  </template>
  <template v-else-if="column.scopeType === '_tag'">
    <a-tag :color="column.tagType?.(record) ?? 'default'">
      {{ column.tagText?.(record) ?? getCellValue(record) }}
    </a-tag>
  </template>
  <template v-else-if="column.scopeType === '_tags'">
    <template v-if="Array.isArray(tags) && tags.length">
      <a-tag v-for="(t, i) in tags.slice(0, 2)" :key="i">{{ t }}</a-tag>
      <a-tooltip v-if="tags.length > 2" :title="tags.slice(2).join(', ')">
        <a-tag>+{{ tags.length - 2 }}</a-tag>
      </a-tooltip>
    </template>
    <span v-else>&mdash;</span>
  </template>
  <template v-else-if="column.scopeType === '_switch'">
    <a-switch
      :checked="Boolean(getCellValue(record))"
      @update:checked="(v: boolean) => {
        if (column.prop) (record as Record<string, unknown>)[column.prop] = v
        column.switchFn?.(v, record)
      }"
    />
  </template>
  <template v-else-if="column.scopeType === '_image'">
    <a-image
      :src="getCellValue(record) as string"
      :width="column.imageWidth ?? 40"
      :height="column.imageHeight ?? 40"
    />
  </template>
  <template v-else-if="column.scopeType === '_numInput'">
    <a-input-number
      :value="Number(getCellValue(record))"
      :max="column.max ? Number(record[column.max]) : undefined"
      size="small"
      @update:value="(v: number | null) => {
        if (column.prop) (record as Record<string, unknown>)[column.prop] = v
      }"
    />
  </template>
  <template v-else>
    {{ column.formatter?.(record) ?? getCellValue(record) }}
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PageTableColumnConfig } from './types'

const props = defineProps<{
  column: PageTableColumnConfig
  record: Record<string, unknown>
  index: number
}>()

const tags = computed(() => {
  const v = props.record[props.column.prop!]
  return Array.isArray(v) ? v : v ? [v] : []
})

function getCellValue(record: Record<string, unknown>): unknown {
  const prop = props.column.prop
  if (!prop) return undefined
  return record[prop]
}
</script>
