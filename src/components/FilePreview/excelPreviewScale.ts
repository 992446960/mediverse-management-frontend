const DEFAULT_COL_WIDTH = 80
const DEFAULT_ROW_HEIGHT = 24
const DEFAULT_FONT_SIZE = 10

type ExcelRecord = Record<string, any>

function scaleNumber(value: number, scale: number): number {
  return Number((value * scale).toFixed(2))
}

function scaleCols(cols: ExcelRecord | undefined, scale: number): ExcelRecord | undefined {
  if (!cols) return cols

  return Object.fromEntries(
    Object.entries(cols).map(([key, value]) => {
      if (key === 'len' || !value || typeof value !== 'object') return [key, value]

      const col = { ...value }
      col.width = scaleNumber(typeof col.width === 'number' ? col.width : DEFAULT_COL_WIDTH, scale)
      return [key, col]
    })
  )
}

function scaleRows(rows: ExcelRecord | undefined, scale: number): ExcelRecord | undefined {
  if (!rows) return rows

  return Object.fromEntries(
    Object.entries(rows).map(([key, value]) => {
      if (key === 'len' || !value || typeof value !== 'object') return [key, value]

      const row = { ...value }
      row.height = scaleNumber(
        typeof row.height === 'number' ? row.height : DEFAULT_ROW_HEIGHT,
        scale
      )
      return [key, row]
    })
  )
}

function scaleStyles(styles: ExcelRecord[] | undefined, scale: number): ExcelRecord[] | undefined {
  if (!styles) return styles

  return styles.map((style) => {
    const nextStyle = { ...style }
    const font = { ...(nextStyle.font || {}) }
    font.size = scaleNumber(typeof font.size === 'number' ? font.size : DEFAULT_FONT_SIZE, scale)
    nextStyle.font = font
    return nextStyle
  })
}

export function scaleExcelWorkbookData<T extends ExcelRecord[]>(workbookData: T, scale: number): T {
  if (scale === 1) return workbookData

  return workbookData.map((sheet) => ({
    ...sheet,
    cols: scaleCols(sheet.cols, scale),
    rows: scaleRows(sheet.rows, scale),
    styles: scaleStyles(sheet.styles, scale),
  })) as unknown as T
}
