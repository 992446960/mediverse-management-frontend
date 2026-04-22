<template>
  <template v-if="column.scopeType === '_link'">
    <a-button
      type="link"
      size="small"
      class="page-table__cell-link text-primary hover:underline text-sm font-medium cursor-pointer"
      :class="{
        'page-table__cell-link--disabled opacity-50 cursor-not-allowed':
          column.linkDisabled?.(record),
      }"
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
      @update:checked="
        (v: boolean) => {
          if (column.prop) (record as Record<string, any>)[column.prop] = v
          column.switchFn?.(v, record)
        }
      "
    />
  </template>
  <template v-else-if="column.scopeType === '_image'">
    <template v-if="imageSrc">
      <a-image
        :src="imageEffectiveSrc"
        :width="column.imageWidth ?? 40"
        :height="column.imageHeight ?? 40"
        :fallback="IMAGE_FALLBACK_URL"
        @error="imageEffectiveSrc = IMAGE_FALLBACK_URL"
      >
        <!-- 仅图标，不显示「预览」文案 -->
        <template #previewMask>
          <EyeOutlined />
        </template>
      </a-image>
    </template>
  </template>
  <template v-else-if="column.scopeType === '_numInput'">
    <a-input-number
      :value="Number(getCellValue(record))"
      :max="column.max ? Number(record[column.max]) : undefined"
      size="small"
      @update:value="
        (v: number | null) => {
          if (column.prop) (record as Record<string, any>)[column.prop] = v
        }
      "
    />
  </template>
  <template v-else>
    {{ column.formatter?.(record) ?? getCellValue(record) }}
  </template>
</template>

<script setup lang="ts">
import { EyeOutlined } from '@ant-design/icons-vue'
import errorImgUrl from '@/assets/error_img.png'
import { toAbsoluteFileUrl } from '@/api/upload'
import type { PageTableColumnConfig } from './types'

/** 有数据但加载失败时使用的占位图 */
const IMAGE_FALLBACK_URL = errorImgUrl

const props = defineProps<{
  column: PageTableColumnConfig
  record: Record<string, any>
  index: number
}>()

const cellProp = computed(() => {
  const p = props.column.prop ?? (props.column as { dataIndex?: string }).dataIndex
  return (Array.isArray(p) ? p.join('.') : p) as string
})

const tags = computed(() => {
  const v = cellProp.value ? props.record[cellProp.value] : undefined
  return Array.isArray(v) ? v : v ? [v] : []
})

function getCellValue(record: Record<string, any>): unknown {
  if (!cellProp.value) return undefined
  return record[cellProp.value]
}

const imageSrc = computed(() => {
  const v = getCellValue(props.record)
  return typeof v === 'string' && v.trim() ? v.trim() : ''
})

const imageDisplayUrl = computed(() => toAbsoluteFileUrl(imageSrc.value))

/** 实际展示的图片 src，加载失败时切换为 fallback */
const imageEffectiveSrc = ref('')
watch(
  () => imageDisplayUrl.value,
  (url) => {
    imageEffectiveSrc.value = url
  },
  { immediate: true }
)
</script>
