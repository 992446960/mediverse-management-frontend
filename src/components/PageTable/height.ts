const MIN_TABLE_SCROLL_Y = 100
const DEFAULT_PAGE_TABLE_SCROLL_X = 'max-content'
const DEFAULT_VISIBLE_ROW_LIMIT = 3

export interface PageTableScrollConfigOptions {
  tableHeight?: number | string
  measuredScrollY?: number
  rowCount: number
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

export function getPageTableScrollConfig(options: PageTableScrollConfigOptions) {
  const {
    tableHeight,
    measuredScrollY = 0,
    rowCount,
    visibleRowLimit = DEFAULT_VISIBLE_ROW_LIMIT,
  } = options
  const scroll: { x: string; y?: number | string } = { x: DEFAULT_PAGE_TABLE_SCROLL_X }

  if (tableHeight != null && tableHeight !== '') {
    scroll.y = tableHeight
    return scroll
  }

  if (measuredScrollY > 0 && rowCount > visibleRowLimit) {
    scroll.y = measuredScrollY
  }

  return scroll
}
