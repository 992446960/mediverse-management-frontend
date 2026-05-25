const MIN_TABLE_SCROLL_Y = 100
const DEFAULT_PAGE_TABLE_SCROLL_X = '100%'
const DEFAULT_COLUMN_SCROLL_WIDTH = 120
const DEFAULT_VISIBLE_ROW_LIMIT = 3

export interface PageTableScrollColumn {
  width?: number | string
  _visible?: boolean
}

export interface PageTableScrollConfigOptions {
  tableHeight?: number | string
  measuredScrollY?: number
  rowCount: number
  scrollX?: number | string
  visibleRowLimit?: number
}

export function getPageTableScrollY(
  containerHeight: number,
  marginBottom = 0,
  headerHeight = 0
): number {
  return Math.max(
    MIN_TABLE_SCROLL_Y,
    Math.floor(containerHeight) - marginBottom - Math.ceil(headerHeight)
  )
}

function getColumnScrollWidth(width: number | string | undefined): number {
  if (typeof width === 'number' && Number.isFinite(width)) return width
  if (typeof width === 'string') {
    const normalized = width.trim()
    if (/^\d+(\.\d+)?(px)?$/.test(normalized)) return Number.parseFloat(normalized)
  }
  return DEFAULT_COLUMN_SCROLL_WIDTH
}

export function getPageTableScrollX(columns: PageTableScrollColumn[]): number {
  return columns
    .filter((column) => column._visible !== false)
    .reduce((sum, column) => sum + getColumnScrollWidth(column.width), 0)
}

export function getPageTableScrollConfig(options: PageTableScrollConfigOptions) {
  const {
    tableHeight,
    measuredScrollY = 0,
    rowCount,
    scrollX = DEFAULT_PAGE_TABLE_SCROLL_X,
    visibleRowLimit = DEFAULT_VISIBLE_ROW_LIMIT,
  } = options
  const scroll: { x: number | string; y?: number | string } = { x: scrollX }

  if (tableHeight != null && tableHeight !== '') {
    scroll.y = tableHeight
    return scroll
  }

  if (measuredScrollY > 0 && rowCount > visibleRowLimit) {
    scroll.y = measuredScrollY
  }

  return scroll
}
