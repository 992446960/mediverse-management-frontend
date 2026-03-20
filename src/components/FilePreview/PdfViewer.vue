<template>
  <div
    class="pdf-viewer flex h-full min-h-[400px] flex-col overflow-hidden bg-white dark:bg-slate-900"
  >
    <div
      v-if="!errorMessage && fileUrl"
      class="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/90"
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
      <span class="text-xs text-slate-600 dark:text-slate-300 min-w-16 tabular-nums">
        {{ Math.round(scalePercent) }}%
      </span>
      <a-divider type="vertical" class="m-0! h-4" />
      <a-button-group size="small">
        <a-button :disabled="currentPage <= 1" @click="goPrevPage">
          <template #icon><LeftOutlined /></template>
        </a-button>
        <a-button :disabled="currentPage >= totalPages" @click="goNextPage">
          <template #icon><RightOutlined /></template>
        </a-button>
      </a-button-group>
      <div class="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
        <a-input-number
          v-model:value="pageInput"
          :min="1"
          :max="Math.max(1, totalPages)"
          size="small"
          class="w-14!"
          @press-enter="applyPageInput"
        />
        <span>/ {{ totalPages }}</span>
      </div>
    </div>
    <div ref="scrollRootRef" class="pdf-viewer__scroll flex min-h-0 flex-1 flex-col">
      <a-empty v-if="errorMessage" :description="errorMessage" class="py-12" />
      <vue-office-pdf
        v-else-if="fileUrl"
        ref="pdfOfficeRef"
        :key="fileUrl"
        :src="fileUrl"
        class="flex-1 min-h-0 h-full"
        @rendered="onRendered"
        @error="onError"
      />
      <a-empty v-else :description="t('knowledge.noPreviewUrl')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { LeftOutlined, MinusOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons-vue'
import VueOfficePdf from '@vue-office/pdf'

const { t } = useI18n()

const props = defineProps<{
  fileUrl: string
}>()

const emit = defineEmits<{
  rendered: []
  error: [err: unknown]
}>()

/** vue-office-pdf 实例（setup 返回值，文档不全） */
type PdfOfficeExpose = {
  numPages?: Ref<number> | number
  containerRef?: Ref<HTMLElement | null> | HTMLElement | null
  wrapperRef?: Ref<HTMLElement | null> | HTMLElement | null
  getScale?: () => Ref<number> | number | { value: number }
  setScale?: (n: number) => void
  /** 在容器从隐藏变为可见后需调用一次以修正虚拟列表与总高度 */
  rerender?: () => void
}

const errorMessage = ref<string | null>(null)
const pdfOfficeRef = ref<ComponentPublicInstance | null>(null)
/** 包裹 vue-office 的滚动区；ResizeObserver / KeepAlive 激活时用于单次 rerender */
const scrollRootRef = ref<HTMLElement | null>(null)
const currentPage = ref(1)
const pageInput = ref(1)
const scalePercent = ref(100)

const MIN_SCALE = 0.5
const MAX_SCALE = 2.5
const ZOOM_STEP = 0.1

let scrollCleanup: (() => void) | null = null
let ioCleanup: (() => void) | null = null
let domMutationCleanup: (() => void) | null = null
let resizeObserverCleanup: (() => void) | null = null
let layoutBoostRoCleanup: (() => void) | null = null

/** 避免在 @rendered 与 ResizeObserver 中重复 rerender 形成环 */
const didLayoutBoost = ref(false)

/** 库暴露的 numPages(ref) 在 vue-office-pdf 内可能从未被赋值，必须以 DOM 为准并随子节点更新 */
const syncedDomPageCount = ref(0)

watch(
  () => props.fileUrl,
  () => {
    errorMessage.value = null
    currentPage.value = 1
    pageInput.value = 1
    scalePercent.value = 100
    syncedDomPageCount.value = 0
    didLayoutBoost.value = false
    teardownObservers()
  }
)

function unwrapEl<T extends HTMLElement>(v: Ref<T | null> | T | null | undefined): T | null {
  if (v == null) return null
  const x = isRef(v) ? v.value : v
  return x
}

function getPdfExpose(): PdfOfficeExpose | null {
  const raw = pdfOfficeRef.value as unknown as PdfOfficeExpose | null
  return raw ?? null
}

function readScale(inst: PdfOfficeExpose): number {
  const g = inst.getScale?.()
  if (g == null) return 1
  if (typeof g === 'number') return g
  if (typeof g === 'object' && 'value' in g && typeof (g as { value: number }).value === 'number') {
    return (g as { value: number }).value
  }
  return 1
}

function readNumPages(inst: PdfOfficeExpose): number {
  const n = inst.numPages
  if (n == null) return 0
  const v = isRef(n) ? n.value : n
  return typeof v === 'number' && v > 0 ? v : 0
}

const totalPages = computed(() => {
  const inst = getPdfExpose()
  if (!inst) return 0
  const fromApi = readNumPages(inst)
  return Math.max(fromApi, syncedDomPageCount.value)
})

function countPagesFromDom(): number {
  const inst = getPdfExpose()
  if (!inst) return 0
  const wrap = unwrapEl(inst.wrapperRef ?? null)
  if (!wrap) return 0
  const nodes = wrap.querySelectorAll('canvas[data-id]')
  let max = 0
  nodes.forEach((el) => {
    const id = Number((el as HTMLCanvasElement).getAttribute('data-id'))
    if (!Number.isNaN(id)) max = Math.max(max, id)
  })
  return max
}

/** 虚拟列表只挂载部分 canvas，总页数需由 wrapper 总高度 / 单页高度推算（与 vue-office 内部公式一致） */
function inferTotalPagesFromWrapperLayout(): number {
  const inst = getPdfExpose()
  const wrap = unwrapEl(inst?.wrapperRef ?? null)
  if (!wrap) return 0
  const hStyle = wrap.style.height
  const totalH = hStyle ? parseFloat(hStyle) : wrap.scrollHeight
  if (!totalH || totalH <= 0) return 0
  const cAny = wrap.querySelector('canvas[data-id]') as HTMLElement | null
  if (!cAny) return 0
  const gap = 10
  const pageH =
    parseFloat(cAny.style.height) ||
    cAny.getBoundingClientRect().height ||
    (cAny as HTMLCanvasElement).height
  const unit = pageH + gap
  if (unit <= 0) return 0
  return Math.max(1, Math.round((totalH + gap) / unit))
}

const canZoomIn = computed(() => {
  const inst = getPdfExpose()
  if (!inst) return false
  return readScale(inst) < MAX_SCALE
})
const canZoomOut = computed(() => {
  const inst = getPdfExpose()
  if (!inst) return false
  return readScale(inst) > MIN_SCALE
})

function syncScaleFromInstance() {
  const inst = getPdfExpose()
  if (!inst) return
  const s = readScale(inst)
  scalePercent.value = Math.round(s * 100)
}

function zoomIn() {
  const inst = getPdfExpose()
  if (!inst?.setScale) return
  const next = Math.min(MAX_SCALE, readScale(inst) + ZOOM_STEP)
  inst.setScale(Number(next.toFixed(2)))
  nextTick(() => syncScaleFromInstance())
}

function zoomOut() {
  const inst = getPdfExpose()
  if (!inst?.setScale) return
  const next = Math.max(MIN_SCALE, readScale(inst) - ZOOM_STEP)
  inst.setScale(Number(next.toFixed(2)))
  nextTick(() => syncScaleFromInstance())
}

function zoomReset() {
  const inst = getPdfExpose()
  inst?.setScale?.(1)
  nextTick(() => syncScaleFromInstance())
}

function getScrollContainer(): HTMLElement | null {
  const inst = getPdfExpose()
  if (!inst) return null
  return unwrapEl(inst.containerRef ?? null)
}

function scrollToPage(page: number) {
  const maxP = Math.max(1, totalPages.value)
  const p = Math.min(Math.max(1, page), maxP)
  const wrap = unwrapEl(getPdfExpose()?.wrapperRef ?? null)
  const container = getScrollContainer()
  if (!wrap || !container) return
  const el = wrap.querySelector(`canvas[data-id="${p}"]`) as HTMLElement | null
  if (el) {
    const cRect = container.getBoundingClientRect()
    const eRect = el.getBoundingClientRect()
    const delta = eRect.top - cRect.top + container.scrollTop
    container.scrollTo({ top: delta, behavior: 'smooth' })
  } else {
    const max = Math.max(1, totalPages.value)
    const ratio = max > 1 ? (p - 1) / (max - 1) : 0
    container.scrollTo({
      top: ratio * (container.scrollHeight - container.clientHeight),
      behavior: 'smooth',
    })
  }
  currentPage.value = p
  pageInput.value = p
}

function goPrevPage() {
  scrollToPage(currentPage.value - 1)
}

function goNextPage() {
  scrollToPage(currentPage.value + 1)
}

function applyPageInput() {
  const v = pageInput.value
  if (typeof v !== 'number' || Number.isNaN(v)) return
  scrollToPage(Math.floor(v))
}

function updateCurrentPageFromScroll() {
  const container = getScrollContainer()
  const wrap = unwrapEl(getPdfExpose()?.wrapperRef ?? null)
  if (!container || !wrap) return
  const centerY = container.getBoundingClientRect().top + container.clientHeight / 2
  const canvases = [...wrap.querySelectorAll('canvas[data-id]')] as HTMLCanvasElement[]
  if (canvases.length === 0) return
  let best = 1
  let bestDist = Number.POSITIVE_INFINITY
  for (const c of canvases) {
    const r = c.getBoundingClientRect()
    const mid = (r.top + r.bottom) / 2
    const d = Math.abs(mid - centerY)
    if (d < bestDist) {
      bestDist = d
      const id = Number(c.getAttribute('data-id'))
      if (!Number.isNaN(id)) best = id
    }
  }
  if (best !== currentPage.value) {
    currentPage.value = best
    pageInput.value = best
  }
}

function teardownObservers() {
  scrollCleanup?.()
  scrollCleanup = null
  ioCleanup?.()
  ioCleanup = null
  domMutationCleanup?.()
  domMutationCleanup = null
  resizeObserverCleanup?.()
  resizeObserverCleanup = null
  layoutBoostRoCleanup?.()
  layoutBoostRoCleanup = null
}

/**
 * 父级用 v-show 隐藏时首次 rendered 容器宽高为 0，虚拟列表页数/布局错误；
 * 在滚动区具备有效尺寸且实例提供 rerender 时执行一次，等价于用户点击缩放触发的内部重算。
 */
function tryLayoutBoost() {
  if (didLayoutBoost.value) return
  const inst = getPdfExpose()
  const rerender = inst?.rerender
  const root = scrollRootRef.value
  const cw = root?.clientWidth ?? 0
  const ch = root?.clientHeight ?? 0
  if (typeof rerender !== 'function') return
  if (!root || cw < 2 || ch < 2) return
  didLayoutBoost.value = true
  nextTick(() => {
    getPdfExpose()?.rerender?.()
    nextTick(() => {
      updateSyncedDomPageCount()
      updateCurrentPageFromScroll()
    })
  })
}

function setupLayoutBoostObserver() {
  layoutBoostRoCleanup?.()
  layoutBoostRoCleanup = null
  const root = scrollRootRef.value
  if (!root || typeof ResizeObserver === 'undefined') return
  const ro = new ResizeObserver(() => {
    tryLayoutBoost()
  })
  ro.observe(root)
  layoutBoostRoCleanup = () => {
    ro.disconnect()
    layoutBoostRoCleanup = null
  }
}

function updateSyncedDomPageCount() {
  const inferred = inferTotalPagesFromWrapperLayout()
  const domWindowMax = countPagesFromDom()
  syncedDomPageCount.value = Math.max(inferred, domWindowMax, syncedDomPageCount.value)
}

function setupScrollTracking() {
  teardownObservers()
  const container = getScrollContainer()
  if (!container) return
  const onScroll = () => {
    updateCurrentPageFromScroll()
  }
  container.addEventListener('scroll', onScroll, { passive: true })
  scrollCleanup = () => container.removeEventListener('scroll', onScroll)

  const wrap = unwrapEl(getPdfExpose()?.wrapperRef ?? null)
  if (!wrap || typeof IntersectionObserver === 'undefined') return
  const io = new IntersectionObserver(
    () => {
      updateCurrentPageFromScroll()
    },
    { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] }
  )
  wrap.querySelectorAll('canvas[data-id]').forEach((c) => io.observe(c))
  ioCleanup = () => io.disconnect()
}

function onRendered() {
  errorMessage.value = null
  emit('rendered')
  nextTick(() => {
    syncScaleFromInstance()
    setupScrollTracking()
    updateSyncedDomPageCount()
    updateCurrentPageFromScroll()

    const inst = getPdfExpose()
    const wrap = unwrapEl(inst?.wrapperRef ?? null)
    const cont = unwrapEl(inst?.containerRef ?? null)

    if (wrap && typeof MutationObserver !== 'undefined') {
      const mo = new MutationObserver(() => {
        updateSyncedDomPageCount()
        updateCurrentPageFromScroll()
      })
      mo.observe(wrap, { childList: true, subtree: true })
      const prev = domMutationCleanup
      domMutationCleanup = () => {
        prev?.()
        mo.disconnect()
      }
    }

    if (cont && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        updateSyncedDomPageCount()
      })
      ro.observe(cont)
      const prev = resizeObserverCleanup
      resizeObserverCleanup = () => {
        prev?.()
        ro.disconnect()
      }
    }

    requestAnimationFrame(() => {
      updateSyncedDomPageCount()
      updateCurrentPageFromScroll()
    })

    tryLayoutBoost()
    setupLayoutBoostObserver()
  })
}

function onError(err: unknown) {
  const msg = err instanceof Error ? err.message : t('knowledge.pdfUnknownError')
  errorMessage.value = t('knowledge.pdfLoadFailed', { msg })
  emit('error', err)
}

watch(totalPages, (n) => {
  if (pageInput.value > n) pageInput.value = Math.max(1, n)
})

onBeforeUnmount(() => {
  teardownObservers()
})

/** 供父级（如 PdfOriginalTabPanel）在 KeepAlive 激活时调用 */
function rerenderLayout() {
  didLayoutBoost.value = false
  nextTick(() => {
    tryLayoutBoost()
    setupLayoutBoostObserver()
  })
}

defineExpose({ rerenderLayout })
</script>

<style scoped>
.pdf-viewer__scroll :deep(.vue-office-pdf) {
  height: 100%;
  min-height: 0;
}
</style>
