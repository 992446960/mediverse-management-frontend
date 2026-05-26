import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const excelViewerSource = readFileSync(
  fileURLToPath(new URL('../../src/components/FilePreview/ExcelViewer.vue', import.meta.url)),
  'utf-8'
)

describe('ExcelViewer resize recovery', () => {
  it('remounts the vue-office excel renderer after container resize', () => {
    expect(excelViewerSource).toContain('ref="resizeRootRef"')
    expect(excelViewerSource).toContain(':key="excelRenderKey"')
    expect(excelViewerSource).toContain('new ResizeObserver')
  })

  it('cleans up the resize observer when unmounted', () => {
    expect(excelViewerSource).toContain('onBeforeUnmount')
    expect(excelViewerSource).toContain('resizeObserver?.disconnect()')
  })

  it('suppresses resize events during re-render to prevent loop', () => {
    expect(excelViewerSource).toContain('rerenderInFlight')
    expect(excelViewerSource).toContain('if (rerenderInFlight) return')
  })

  it('sets baseline from first ResizeObserver callback instead of getBoundingClientRect', () => {
    expect(excelViewerSource).not.toContain('getBoundingClientRect')
    expect(excelViewerSource).toContain('if (!lastResizeSize)')
  })
})
