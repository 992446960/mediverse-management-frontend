<template>
  <div class="excel-viewer flex h-full min-h-0 flex-col overflow-hidden bg-white dark:bg-slate-900">
    <template v-if="fileUrl">
      <div
        class="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/90 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/90"
      >
        <a-button-group size="small">
          <a-button :disabled="!canZoomOut" @click="zoomOut">
            <template #icon><MinusOutlined /></template>
          </a-button>
          <a-button :disabled="!canZoomIn" @click="zoomIn">
            <template #icon><PlusOutlined /></template>
          </a-button>
          <a-button @click="zoomReset">{{ t('knowledge.previewZoomReset') }}</a-button>
        </a-button-group>
        <span class="min-w-16 text-xs tabular-nums text-slate-600 dark:text-slate-300">
          {{ scalePercent }}%
        </span>
        <a-divider type="vertical" class="m-0! h-4" />
        <span class="max-w-[min(24rem,70vw)] text-xs text-slate-500 dark:text-slate-400">
          {{ t('knowledge.previewExcelSheetHint') }}
        </span>
      </div>
      <div class="min-h-0 flex-1 overflow-auto p-4">
        <div :style="wrapperStyle">
          <vue-office-excel
            :src="fileUrl"
            class="min-h-full"
            @rendered="onRendered"
            @error="onError"
          />
        </div>
      </div>
    </template>
    <a-empty v-else class="py-12" :description="t('knowledge.noPreviewUrl')" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MinusOutlined, PlusOutlined } from '@ant-design/icons-vue'
import VueOfficeExcel from '@vue-office/excel'
import { usePreviewTransformZoom } from '@/composables/usePreviewTransformZoom'

const { t } = useI18n()

defineProps<{
  fileUrl: string
}>()

const emit = defineEmits<{
  rendered: []
  error: [err: unknown]
}>()

const { scalePercent, canZoomIn, canZoomOut, zoomIn, zoomOut, zoomReset, wrapperStyle } =
  usePreviewTransformZoom()

function onRendered() {
  emit('rendered')
}

function onError(err: unknown) {
  emit('error', err)
}
</script>

<style scoped>
.excel-viewer :deep(.vue-office-excel) {
  min-height: 100%;
}
</style>
