import { describe, expect, it } from 'vitest'
import {
  getPageTableScrollConfig,
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
    expect(getPageTableScrollConfig({ measuredScrollY: 360, rowCount: 1 })).toEqual({
      x: 'max-content',
    })
  })

  it('enables vertical scroll when row count can overflow visible body', () => {
    expect(getPageTableScrollConfig({ measuredScrollY: 360, rowCount: 8 })).toEqual({
      x: 'max-content',
      y: 360,
    })
  })

  it('keeps explicit table height authoritative', () => {
    expect(
      getPageTableScrollConfig({ tableHeight: 240, measuredScrollY: 360, rowCount: 1 })
    ).toEqual({
      x: 'max-content',
      y: 240,
    })
  })
})
