import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const excelViewerSource = readFileSync(
  fileURLToPath(new URL('../../src/components/FilePreview/ExcelViewer.vue', import.meta.url)),
  'utf-8'
)

const universalFilePreviewSource = readFileSync(
  fileURLToPath(new URL('../../src/components/UniversalFilePreview/index.vue', import.meta.url)),
  'utf-8'
)

describe('ExcelViewer resize recovery', () => {
  it('remounts the vue-office excel renderer after container resize', () => {
    expect(excelViewerSource).toContain('ref="rootRef"')
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

  it('sets explicit pixel dimensions from ResizeObserver', () => {
    expect(excelViewerSource).toContain('containerWidth')
    expect(excelViewerSource).toContain('containerHeight')
    expect(excelViewerSource).toContain('excelSizeStyle')
  })

  it('accepts viewport dimensions measured by the preview body', () => {
    expect(excelViewerSource).toContain('viewportSize?:')
    expect(excelViewerSource).toContain('props.viewportSize?.width')
    expect(excelViewerSource).toContain('props.viewportSize?.height')
  })

  it('remounts after the first measured size reaches the excel renderer', () => {
    expect(excelViewerSource).toContain('queueExcelRerender()')
    expect(excelViewerSource).not.toContain(
      'if (!lastResizeSize) {\\n    lastResizeSize = nextSize\\n    return\\n  }'
    )
  })
})

describe('UniversalFilePreview excel viewport', () => {
  it('passes measured preview body dimensions to the excel viewer', () => {
    expect(universalFilePreviewSource).toContain('ref="previewBodyRef"')
    expect(universalFilePreviewSource).toContain(':viewport-size="previewBodySize"')
    expect(universalFilePreviewSource).toContain('new ResizeObserver')
  })
})
