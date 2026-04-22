const MIN = 0.5
const MAX = 2.5
const STEP = 0.1

function roundScale(n: number): number {
  return Number(n.toFixed(2))
}

/** Docx/Excel 等非 PDF：用 transform 缩放包装层（不依赖 vue-office 实例 API） */
export function usePreviewTransformZoom() {
  const scale = ref(1)

  const scalePercent = computed(() => Math.round(scale.value * 100))

  const canZoomIn = computed(() => scale.value < MAX)
  const canZoomOut = computed(() => scale.value > MIN)

  function zoomIn() {
    scale.value = roundScale(Math.min(MAX, scale.value + STEP))
  }

  function zoomOut() {
    scale.value = roundScale(Math.max(MIN, scale.value - STEP))
  }

  function zoomReset() {
    scale.value = 1
  }

  const wrapperStyle = computed(() => ({
    transform: `scale(${scale.value})`,
    transformOrigin: 'top center',
    width: `${100 / scale.value}%`,
  }))

  return {
    scale,
    scalePercent,
    canZoomIn,
    canZoomOut,
    zoomIn,
    zoomOut,
    zoomReset,
    wrapperStyle,
  }
}
