import { reactive } from 'vue'

export interface DictOption {
  label: string
  value: string | number | boolean
  color?: string
  default?: boolean
}

export type DictMap = Record<string, DictOption[]>

const builtinDicts: DictMap = {
  user_status: [
    { label: '启用', value: true, color: 'green' },
    { label: '禁用', value: false, color: 'red' },
  ],
  user_role: [
    { label: '超级管理员', value: 'sysadmin', color: 'purple' },
    { label: '机构管理员', value: 'org_admin', color: 'blue' },
    { label: '科室管理员', value: 'dept_admin', color: 'cyan' },
    { label: '普通用户', value: 'user', color: 'default' },
  ],
}

export function useDict(...dictTypes: string[]) {
  const dicts = reactive<Record<string, DictOption[]>>({})

  dictTypes.forEach((type) => {
    dicts[type] = builtinDicts[type] || []
  })

  return dicts
}

export function getDictLabel(options: DictOption[], value: unknown): string {
  const found = options.find((opt) => opt.value === value)
  return found?.label || String(value)
}

export function getDictColor(options: DictOption[], value: unknown): string {
  const found = options.find((opt) => opt.value === value)
  return found?.color || 'default'
}
