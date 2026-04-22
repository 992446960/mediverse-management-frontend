import type { Component } from 'vue'

export interface PageFilterField {
  /** 表单字段名，同时用于 formData 键名和查询参数键名 */
  key: string
  /** FormItem 标签 */
  label?: string
  /** 与表格列字段联动：当关联列 _visible === false 时该筛选项被隐藏 */
  tableLink?: string
  /** 字段类型 */
  type?: 'input' | 'select' | 'date' | 'date-range' | 'number-input' | 'slot'
  /** 初始值，仅初次构建 formData 时写入 */
  defaultValue?: unknown
  /** 栅格宽度（24 栅格制），默认 6 */
  col?: number
  /** 占位文案 */
  ph?: string
  /** 输入框前缀图标（Ant Design Icons Vue 组件） */
  icon?: Component
  /** select 是否多选 */
  multiple?: boolean
  /** select 选项 */
  options?: Array<{ label: string; value: string | number }>
  /** select 是否可清空 */
  clearable?: boolean
  /** select 是否可搜索（AntDV 中映射为 showSearch） */
  filterable?: boolean
  /** 日期控件子类型：'date' | 'daterange' | 'datetimerange' 等 */
  dateType?: string
  /** 日期值格式，默认 'YYYY-MM-DD' */
  format?: string
  /** 单日期是否启用快捷选项 */
  short?: boolean
  /** 日期区间起始占位 */
  sph?: string
  /** 日期区间结束占位 */
  eph?: string
  /** 禁用日期逻辑 */
  disabledDate?: (current: unknown) => boolean
  /** 自定义字段插槽名，仅 type === 'slot' 时生效 */
  slotName?: string
  /** 是否默认展示，false 项折叠到"更多筛选"后 */
  _usual?: boolean
  /** 是否隐藏表单项 */
  hide?: boolean
  /** 最小值占位文案 */
  minPh?: string
  /** 最大值占位文案 */
  maxPh?: string
  /** 最小值 */
  min?: number
  /** 最大值 */
  max?: number
}

export interface PageFilterBtn {
  /** 按钮文案 */
  text: string
  /** 按钮类型，映射 AntDV a-button type */
  type?: string
  /** 按钮图标 */
  icon?: Component
  /** 点击行为回调 */
  handle?: () => void
}

export interface PageFilterConfig {
  /** 筛选项配置数组 */
  filterForm: PageFilterField[]
  /** 右侧操作按钮（查询/重置/导出等） */
  btns?: PageFilterBtn[]
  /** 按钮栏栅格宽度（24 栅格制），默认 6 */
  btnsCol?: number
}
