import { describe, expect, it } from 'vitest'
import { getPageTableScrollY } from '../../src/components/PageTable/height'

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
