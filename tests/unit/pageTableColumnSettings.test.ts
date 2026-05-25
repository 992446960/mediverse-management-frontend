import { describe, expect, it } from 'vitest'

import {
  createColumnSettingsState,
  getColumnConfigAbility,
  getColumnSettingsLabel,
  resetColumnSettingsState,
  syncColumnSettingsState,
} from '../../src/components/PageTable/columnSettings'
import type { PageTableColumnConfig } from '../../src/components/PageTable/types'

describe('page table list settings', () => {
  it('initializes default visible, resizable and fixed states', () => {
    const columns: PageTableColumnConfig[] = [
      { type: 'selection', width: 60, fixed: 'left' },
      { label: '文件名', prop: 'file_name', width: 200, resizable: true },
      { label: '操作', type: 'operation', width: 300, fixed: 'right' },
    ]

    const state = createColumnSettingsState(columns)

    expect(getColumnSettingsLabel(state[0], '选择')).toBe('选择')
    expect(state[0]).toMatchObject({
      _visible: true,
      _defaultVisible: true,
      _defaultFixed: 'left',
      _defaultResizable: false,
    })
    expect(state[1]).toMatchObject({
      _visible: true,
      _defaultVisible: true,
      _defaultFixed: false,
      _defaultResizable: true,
    })
    expect(state[2]).toMatchObject({
      _defaultFixed: 'right',
      _defaultResizable: false,
    })
  })

  it('resets user list settings to defaults', () => {
    const columns = createColumnSettingsState([
      { label: '选择', type: 'selection', fixed: 'left', width: 60 },
      { label: '文件名', prop: 'file_name', resizable: true, width: 200 },
    ])

    columns[0]._visible = false
    columns[0].fixed = false
    columns[1].resizable = false
    columns[1].fixed = 'right'
    columns[1]._index = 0
    columns[0]._index = 1

    const reset = resetColumnSettingsState(columns)

    expect(reset.map((column) => column.label)).toEqual(['选择', '文件名'])
    expect(reset[0]).toMatchObject({ _visible: true, fixed: 'left', resizable: false })
    expect(reset[1]).toMatchObject({ _visible: true, fixed: false, resizable: true })
  })

  it('keeps user settings when source columns refresh dynamic fields', () => {
    const current = createColumnSettingsState([
      { label: '旧文件名', prop: 'file_name', resizable: true, width: 200 },
    ])
    current[0]._visible = false
    current[0].resizable = false
    current[0].fixed = 'right'

    const next = syncColumnSettingsState(current, [
      { label: '文件名', prop: 'file_name', resizable: true, width: 240 },
    ])

    expect(next[0]).toMatchObject({
      label: '文件名',
      width: 200,
      _visible: false,
      resizable: false,
      fixed: 'right',
    })
  })

  it('disables locked list settings fields', () => {
    const locked = getColumnConfigAbility({ label: '操作', type: 'operation', lock: true })
    const partial = getColumnConfigAbility({
      label: '选择',
      type: 'selection',
      configurable: { order: false, fixed: true, resizable: false, visible: true },
    })

    expect(locked).toEqual({ visible: false, resizable: false, fixed: false, order: false })
    expect(partial).toEqual({ visible: true, resizable: false, fixed: true, order: false })
  })
})
