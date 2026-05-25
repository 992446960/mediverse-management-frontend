import type { PageTableColumnConfig } from './types'

export interface PageTableColumnConfigAbility {
  visible: boolean
  resizable: boolean
  fixed: boolean
  order: boolean
}

export function getColumnSettingsKey(column: PageTableColumnConfig): string {
  return String(column._id ?? column.prop ?? column.type ?? '')
}

export function getColumnSettingsLabel(
  column: PageTableColumnConfig | undefined,
  fallback: string
): string {
  return column?.label || fallback
}

export function createColumnSettingsState(
  columns: PageTableColumnConfig[]
): PageTableColumnConfig[] {
  return columns.map((column, index) => {
    const defaultIndex = column._defaultIndex ?? column._index ?? index
    const defaultVisible = column._defaultVisible ?? column._visible ?? true
    const defaultResizable = column._defaultResizable ?? column.resizable ?? false
    const defaultFixed = column._defaultFixed ?? column.fixed ?? false

    return {
      ...column,
      fixed: column.fixed ?? defaultFixed,
      resizable: column.resizable ?? defaultResizable,
      _index: column._index ?? defaultIndex,
      _defaultIndex: defaultIndex,
      _visible: column._visible ?? defaultVisible,
      _defaultVisible: defaultVisible,
      _defaultResizable: defaultResizable,
      _defaultFixed: defaultFixed,
    }
  })
}

export function resetColumnSettingsState(
  columns: PageTableColumnConfig[]
): PageTableColumnConfig[] {
  const restored = columns.map((column) => ({
    ...column,
    fixed: column._defaultFixed ?? false,
    resizable: column._defaultResizable ?? false,
    _visible: column._defaultVisible ?? true,
    _index: column._defaultIndex ?? 0,
  }))

  restored.sort((a, b) => (a._index ?? 0) - (b._index ?? 0))
  restored.forEach((column, index) => {
    column._index = index
  })

  return restored
}

function mergeRuntimeColumnFields(
  current: PageTableColumnConfig,
  source: PageTableColumnConfig
): PageTableColumnConfig {
  return {
    ...current,
    label: source.label,
    prop: source.prop,
    type: source.type,
    align: source.align,
    showOverflowTooltip: source.showOverflowTooltip,
    sortable: source.sortable,
    reserveSelection: source.reserveSelection,
    selectDisabled: source.selectDisabled,
    indexMethod: source.indexMethod,
    btns: source.btns,
    formatter: source.formatter,
    tagType: source.tagType,
    tagText: source.tagText,
    scopeType: source.scopeType,
    slotName: source.slotName,
    linkFn: source.linkFn,
    linkDisabled: source.linkDisabled,
    switchFn: source.switchFn,
    imageWidth: source.imageWidth,
    imageHeight: source.imageHeight,
    max: source.max,
    lock: source.lock,
    configurable: source.configurable,
  }
}

export function syncColumnSettingsState(
  current: PageTableColumnConfig[],
  source: PageTableColumnConfig[]
): PageTableColumnConfig[] {
  if (!current.length) return createColumnSettingsState(source)

  const sourceMap = new Map(source.map((column) => [getColumnSettingsKey(column), column]))
  const usedKeys = new Set<string>()
  const synced = current
    .map((column) => {
      const key = getColumnSettingsKey(column)
      const next = sourceMap.get(key)
      if (!next) return undefined
      usedKeys.add(key)
      return mergeRuntimeColumnFields(column, next)
    })
    .filter((column): column is PageTableColumnConfig => Boolean(column))

  source.forEach((column) => {
    const key = getColumnSettingsKey(column)
    if (!usedKeys.has(key)) {
      const created = createColumnSettingsState([column])[0]
      if (created) synced.push(created)
    }
  })

  return synced
}

export function getColumnConfigAbility(
  column: PageTableColumnConfig
): PageTableColumnConfigAbility {
  if (column.lock) {
    return { visible: false, resizable: false, fixed: false, order: false }
  }

  return {
    visible: column.configurable?.visible ?? true,
    resizable: column.configurable?.resizable ?? true,
    fixed: column.configurable?.fixed ?? true,
    order: column.configurable?.order ?? true,
  }
}
