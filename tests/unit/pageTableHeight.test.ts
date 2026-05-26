import { describe, expect, it } from 'vitest'
import {
  getPageTableScrollConfig,
  getPageTableScrollX,
  getPageTableScrollY,
} from '../../src/components/PageTable/height'

describe('page table height calculation', () => {
  it('does not reserve extra bottom space by default', () => {
    expect(getPageTableScrollY(420)).toBe(420)
  })

  it('keeps explicit bottom reservation configurable', () => {
    expect(getPageTableScrollY(420, 16)).toBe(404)
  })

  it('reserves table header height for antd scroll body', () => {
    expect(getPageTableScrollY(420, 0, 52)).toBe(368)
  })

  it('keeps a minimum scroll height', () => {
    expect(getPageTableScrollY(80, 16)).toBe(100)
  })
})

describe('page table scroll config', () => {
  it('keeps horizontal scroll when vertical scroll is unnecessary', () => {
    expect(getPageTableScrollConfig({ measuredScrollY: 360, rowCount: 1, scrollX: 1260 })).toEqual({
      x: 1260,
    })
  })

  it('enables vertical scroll when row count can overflow visible body', () => {
    expect(getPageTableScrollConfig({ measuredScrollY: 360, rowCount: 8, scrollX: 1260 })).toEqual({
      x: 1260,
      y: 360,
    })
  })

  it('keeps explicit table height authoritative', () => {
    expect(
      getPageTableScrollConfig({
        tableHeight: 240,
        measuredScrollY: 360,
        rowCount: 1,
        scrollX: 1260,
      })
    ).toEqual({
      x: 1260,
      y: 240,
    })
  })
})

describe('page table horizontal scroll width', () => {
  it('uses visible numeric column widths instead of max-content text width', () => {
    expect(
      getPageTableScrollX([
        { width: 40 },
        { width: 80 },
        { width: 120 },
        { width: 300 },
        { width: 160, _visible: false },
      ])
    ).toBe(540)
  })

  it('falls back to a stable width for columns without numeric width', () => {
    expect(getPageTableScrollX([{ width: '16rem' }, {}])).toBe(240)
  })
})
