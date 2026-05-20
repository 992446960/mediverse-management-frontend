const MIN_TABLE_SCROLL_Y = 100

export function getPageTableScrollY(containerHeight: number, marginBottom = 0): number {
  return Math.max(MIN_TABLE_SCROLL_Y, Math.floor(containerHeight) - marginBottom)
}
