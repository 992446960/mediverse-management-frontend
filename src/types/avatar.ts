import type { PaginationParams } from './api'

/** 分身类型枚举值：全科 | 专科 | 专家，供多处复用（StepType、筛选、表格等） */
export const AVATAR_TYPE_VALUES = ['general', 'specialist', 'expert'] as const

/** 分身类型：全科 / 专科 / 专家 */
export type AvatarType = (typeof AVATAR_TYPE_VALUES)[number]

/** 分身类型对应的 i18n label key（列表、筛选、确认步骤等复用） */
export const AVATAR_TYPE_LABEL_KEYS: Record<AvatarType, string> = {
  general: 'avatar.typeGeneral',
  specialist: 'avatar.typeSpecialist',
  expert: 'avatar.typeExpert',
}

/** 分身类型对应的表格/标签颜色（列表页、表格组件复用） */
export const AVATAR_TYPE_TAG_COLORS: Record<AvatarType, string> = {
  general: 'blue',
  specialist: 'green',
  expert: 'purple',
}

/** 向导步骤「选择类型」的配置（StepType.vue 复用） */
export const AVATAR_WIZARD_TYPE_OPTIONS: {
  value: AvatarType
  titleKey: string
  detailKey: string
}[] = [
  {
    value: 'general',
    titleKey: 'avatar.wizard.descGeneral',
    detailKey: 'avatar.wizard.descGeneralDetail',
  },
  {
    value: 'specialist',
    titleKey: 'avatar.wizard.descSpecialist',
    detailKey: 'avatar.wizard.descSpecialistDetail',
  },
  {
    value: 'expert',
    titleKey: 'avatar.wizard.descExpert',
    detailKey: 'avatar.wizard.descExpertDetail',
  },
]

/** 类型收窄：判断是否为有效分身类型（筛选、表单等复用） */
export function isAvatarType(value: unknown): value is AvatarType {
  return typeof value === 'string' && AVATAR_TYPE_VALUES.includes(value as AvatarType)
}

/** 沟通风格预设 */
export type AvatarStyle = 'formal' | 'friendly' | 'concise' | 'detailed' | 'custom'

/** 分身列表项（与 API GET /avatars 一致） */
export interface Avatar {
  id: string
  type: AvatarType
  org_id: string
  org_name: string
  dept_id: string | null
  dept_name: string | null
  user_id: string | null
  user_name: string | null
  name: string
  avatar_url: string | null
  bio: string | null
  tags: string[]
  greeting: string | null
  style: AvatarStyle
  /** style=custom 时的自定义风格文案 */
  style_custom?: string | null
  status: 'active' | 'inactive'
  created_by: string
  created_at: string
  updated_at: string
}

/** 分身列表查询参数（与 API 一致） */
export interface AvatarListParams extends PaginationParams {
  org_id?: string
  dept_id?: string
  type?: AvatarType
  keyword?: string
  status?: 'active' | 'inactive'
}

/** 创建分身请求体（与 API POST /avatars 一致） */
export interface CreateAvatarParams {
  type: AvatarType
  org_id?: string
  dept_id?: string
  user_id?: string
  name: string
  avatar_url?: string
  bio?: string
  tags?: string[]
  greeting?: string
  style?: AvatarStyle
  style_custom?: string
}

/** 更新分身请求体（与 API PUT /avatars/:id 一致，字段可选） */
export interface UpdateAvatarParams {
  name?: string
  avatar_url?: string | null
  bio?: string | null
  tags?: string[]
  greeting?: string | null
  style?: AvatarStyle
  style_custom?: string | null
  status?: 'active' | 'inactive'
}

/** 向导式创建表单数据（步骤 1～4 汇总） */
export interface AvatarWizardForm {
  type: AvatarType
  org_id?: string
  dept_id?: string
  user_id?: string
  name: string
  avatar_url?: string
  bio?: string
  tags: string[]
  greeting?: string
  style: AvatarStyle
  style_custom?: string
}
