import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const loaderSource = readFileSync(
  fileURLToPath(
    new URL('../../src/components/FilePreview/ExcelPreviewLoader.vue', import.meta.url)
  ),
  'utf-8'
)

describe('ExcelPreviewLoader static contract', () => {
  it('detects excel binary kind and routes legacy conversion through worker', () => {
    expect(loaderSource).toContain('detectExcelBinaryKind')
    expect(loaderSource).toContain('shouldUseLegacyXlsConversion')
    expect(loaderSource).toContain('convertLegacyXlsInWorker')
    expect(loaderSource).toContain('LEGACY_XLS_MAX_PREVIEW_BYTES')
  })

  it('renders ExcelViewer after preparing a renderable source', () => {
    expect(loaderSource).toContain('ExcelViewer')
    expect(loaderSource).toContain(':file-url="renderFileUrl"')
    expect(loaderSource).toContain(':viewport-size="viewportSize"')
  })

  it('offers a download fallback for large, timeout and failed conversions', () => {
    expect(loaderSource).toContain('triggerFileDownload')
    expect(loaderSource).toContain('knowledge.previewExcelPreparing')
    expect(loaderSource).toContain('knowledge.previewExcelConverting')
    expect(loaderSource).toContain('knowledge.previewExcelLegacyLargeOrTimeout')
    expect(loaderSource).toContain('knowledge.previewExcelLegacyFailed')
  })
})
