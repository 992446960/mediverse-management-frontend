import type { Rule } from 'ant-design-vue/es/form/interface'

/**
 * Select 选项
 */
export interface FormItemOption {
  label: string
  value: string | number
}

/**
 * 配置化表单项类型
 */
export type FormItemType = 'input' | 'textarea' | 'select' | 'number'

/**
 * 表单项配置（数据驱动）
 * - name: 字段名，与 form 的 model 对应
 * - label: 标签
 * - type: 控件类型
 * - placeholder、rules、disabled 等为可选
 * - select 时需传 options
 */
export interface ModalFormItemConfig {
  name: string
  label: string
  type: FormItemType
  placeholder?: string
  rules?: Rule[]
  disabled?: boolean
  /** input/textarea 最大长度 */
  maxlength?: number
  /** textarea 行数 */
  rows?: number
  /** select 选项 */
  options?: FormItemOption[]
  /** select 是否可搜索 */
  showSearch?: boolean
  /** select 是否允许多选 */
  mode?: 'multiple' | 'tags'
  /** 是否在表单中隐藏（如仅用于回填） */
  hidden?: boolean
}
