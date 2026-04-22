import { message } from 'ant-design-vue'
import type { User } from '@/types/auth'
import type { Skill } from '@/types/skill'
import type { OwnerType } from '@/types/knowledge'

export type SkillInputFileItem = { url?: string; file: File }

/**
 * 知识库域 owner（API 4.x）：科室 > 机构 > 个人
 */
export function resolveKnowledgeOwnerFromUser(
  user: User | null | undefined
): { owner_type: Exclude<OwnerType, 'avatar'>; owner_id: string } | null {
  if (!user) return null
  if (user.dept_id) return { owner_type: 'dept', owner_id: user.dept_id }
  if (user.org_id) return { owner_type: 'org', owner_id: user.org_id }
  return { owner_type: 'personal', owner_id: user.id }
}

export interface BuildSkillArgsOptions {
  skill: Skill
  inputText: string
  fileList: SkillInputFileItem[] | undefined
  user: User | null | undefined
  t: (key: string, params?: Record<string, unknown>) => string
}

/**
 * 按技能 args_schema 组装 execute 的 args；校验失败返回 null（已提示 message）
 */
export function buildSkillExecuteArgs(
  options: BuildSkillArgsOptions
): Record<string, unknown> | null {
  const { skill, inputText, fileList, user, t } = options
  const required = skill.args_schema.required ?? []
  const properties = skill.args_schema.properties ?? {}
  const args: Record<string, unknown> = {}

  if (required.includes('query')) {
    const query = inputText.trim()
    if (!query) {
      message.warning(t('chat.skillNeedInput'))
      return null
    }
    args.query = query
  }

  if (required.includes('file_url')) {
    const list = fileList
    if (!list || list.length === 0) {
      message.warning(t('chat.skillNeedFile'))
      return null
    }
    args.file_url = list[0]!.url || URL.createObjectURL(list[0]!.file)
  }

  const ownerRequired = required.includes('owner_type') || required.includes('owner_id')

  const ownerInSchema = 'owner_type' in properties || 'owner_id' in properties

  if (ownerRequired) {
    const owner = resolveKnowledgeOwnerFromUser(user)
    if (!owner) {
      message.warning(t('chat.skillNeedLogin'))
      return null
    }
    args.owner_type = owner.owner_type
    args.owner_id = owner.owner_id
  } else if (ownerInSchema) {
    const owner = resolveKnowledgeOwnerFromUser(user)
    if (owner) {
      args.owner_type = owner.owner_type
      args.owner_id = owner.owner_id
    }
  }

  if (required.includes('top_k')) {
    args.top_k = 5
  } else if ('top_k' in properties && args.top_k === undefined) {
    args.top_k = 5
  }

  for (const key of required) {
    if (args[key] === undefined) {
      message.warning(t('chat.skillMissingField', { field: key }))
      return null
    }
  }

  return args
}
