/**
 * 筛选项类型
 */
export type TableFilterFieldType = 'input' | 'select'

/**
 * 下拉选项
 */
export interface TableFilterOption {
  label: string
  value: string | number
}

/**
 * 筛选项配置（数据驱动）
 */
export interface TableFilterFieldConfig {
  key: string
  label: string
  type: TableFilterFieldType
  placeholder?: string
  /** select 时的选项 */
  options?: TableFilterOption[]
  /** 输入框宽度类名，如 w-64、min-w-[140px] */
  inputClass?: string
}

/**
 * 表格筛选栏可选标题区主操作按钮配置（如「新增科室」）
 */
export interface TableFilterPrimaryAction {
  /** 按钮文案 */
  text: string
  /** 权限指令 v-permission 所需角色列表，不传则不限制 */
  permission?: string[]
}
