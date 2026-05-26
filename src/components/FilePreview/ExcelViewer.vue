<template>
  <div
    ref="rootRef"
    class="excel-viewer flex h-full min-h-0 flex-col overflow-hidden bg-white dark:bg-slate-900"
  >
    <template v-if="fileUrl">
      <div
        class="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/90 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/90"
      >
        <a-segmented v-model:value="excelScale" :options="excelScaleOptions" size="small" />
      </div>
      <div class="min-h-0 flex-1 overflow-hidden">
        <vue-office-excel
          :key="excelRenderKey"
          :src="fileUrl"
          :options="excelOptions"
          :style="excelSizeStyle"
          @rendered="onRendered"
          @error="onError"
        />
      </div>
    </template>
    <a-empty v-else class="py-12" :description="t('knowledge.noPreviewUrl')" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import VueOfficeExcel from '@vue-office/excel'
import { scaleExcelWorkbookData } from './excelPreviewScale'
import '@vue-office/excel/lib/index.css'

const { t } = useI18n()

type ViewportSize = {
  width: number
  height: number
}

const props = defineProps<{
  fileUrl: string
  viewportSize?: ViewportSize
}>()

const emit = defineEmits<{
  rendered: []
  error: [err: unknown]
}>()

const rootRef = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
const containerHeight = ref(0)
const excelRenderVersion = ref(0)
const excelScale = ref(1.25)
const excelRenderKey = computed(
  () => `${props.fileUrl}:${excelRenderVersion.value}:${excelScale.value}`
)
const excelScaleOptions = [
  { label: '100%', value: 1 },
  { label: '125%', value: 1.25 },
  { label: '150%', value: 1.5 },
]

const measuredWidth = computed(() => props.viewportSize?.width || containerWidth.value)
const measuredHeight = computed(() => props.viewportSize?.height || containerHeight.value)

const excelSizeStyle = computed(() => ({
  width: measuredWidth.value ? `${measuredWidth.value}px` : '100%',
  height: measuredHeight.value ? `${measuredHeight.value}px` : '100%',
}))

const excelOptions = computed(() => ({
  transformData: (workbookData: Record<string, any>[]) =>
    scaleExcelWorkbookData(workbookData, excelScale.value),
}))

let resizeObserver: ResizeObserver | null = null
let resizeTimer: ReturnType<typeof window.setTimeout> | null = null
let lastResizeSize = ''
let rerenderInFlight = false

function clearResizeTimer() {
  if (resizeTimer == null) return
  window.clearTimeout(resizeTimer)
  resizeTimer = null
}

function getSizeKey(w: number, h: number) {
  if (w <= 0 || h <= 0) return ''
  return `${Math.round(w)}x${Math.round(h)}`
}

function queueExcelRerender() {
  if (rerenderInFlight) return
  clearResizeTimer()
  resizeTimer = window.setTimeout(() => {
    rerenderInFlight = true
    excelRenderVersion.value += 1
    resizeTimer = null
  }, 180)
}

function handleResize(rect: Pick<DOMRectReadOnly, 'width' | 'height'>) {
  if (rect.width <= 0 || rect.height <= 0) return

  containerWidth.value = Math.round(rect.width)
  containerHeight.value = Math.round(rect.height)
}

watch(
  () => getSizeKey(measuredWidth.value, measuredHeight.value),
  (nextSize) => {
    if (!nextSize || rerenderInFlight || nextSize === lastResizeSize) return
    lastResizeSize = nextSize
    queueExcelRerender()
  },
  { flush: 'post' }
)

onMounted(() => {
  const root = rootRef.value
  if (!root || typeof ResizeObserver === 'undefined') return

  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) return
    handleResize(entry.contentRect)
  })
  resizeObserver.observe(root)
})

onBeforeUnmount(() => {
  clearResizeTimer()
  resizeObserver?.disconnect()
  resizeObserver = null
})

function onRendered() {
  if (rerenderInFlight) {
    lastResizeSize = ''
    nextTick(() => {
      rerenderInFlight = false
    })
  }
  emit('rendered')
}

function onError(err: unknown) {
  emit('error', err)
}
</script>

<style scoped lang="scss">
.excel-viewer :deep(.vue-office-excel) {
  overflow: hidden;
}
</style>
