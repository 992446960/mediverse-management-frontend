import { describe, expect, it } from 'vitest'
import { scaleExcelWorkbookData } from '../../src/components/FilePreview/excelPreviewScale'

describe('scaleExcelWorkbookData', () => {
  it('scales column width, row height and font size without mutating source data', () => {
    const source = [
      {
        styles: [{ font: { size: 10, name: 'Arial' } }, { color: '#111111' }],
        rows: {
          0: { height: 24, cells: { 0: { text: 'A' } } },
          1: { cells: { 0: { text: 'B' } } },
          len: 2,
        },
        cols: {
          0: { width: 80 },
          1: {},
          len: 2,
        },
      },
    ]

    const scaled = scaleExcelWorkbookData(source, 1.25)

    expect(scaled).not.toBe(source)
    expect(scaled[0].cols[0].width).toBe(100)
    expect(scaled[0].cols[1].width).toBe(100)
    expect(scaled[0].rows[0].height).toBe(30)
    expect(scaled[0].rows[1].height).toBe(30)
    expect(scaled[0].styles[0].font.size).toBe(12.5)
    expect(scaled[0].styles[1].font.size).toBe(12.5)

    expect(source[0].cols[0].width).toBe(80)
    expect(source[0].cols[1].width).toBeUndefined()
    expect(source[0].rows[0].height).toBe(24)
    expect(source[0].rows[1].height).toBeUndefined()
    expect(source[0].styles[0].font.size).toBe(10)
    expect(source[0].styles[1].font).toBeUndefined()
  })
})
