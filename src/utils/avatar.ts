import type { AvatarModelConfig } from '@/types/advancedConfig'
import type { AvatarStyle } from '@/types/avatar'

export const STYLE_LABEL_KEYS: Record<AvatarStyle, string> = {
  formal: 'avatar.wizard.styleFormal',
  friendly: 'avatar.wizard.styleFriendly',
  concise: 'avatar.wizard.styleConcise',
  detailed: 'avatar.wizard.styleDetailed',
  custom: 'avatar.wizard.styleCustom',
}

export const STYLE_DESCRIPTION_KEYS: Record<AvatarStyle, string> = {
  formal: 'avatar.wizard.styleFormalDesc',
  friendly: 'avatar.wizard.styleFriendlyDesc',
  concise: 'avatar.wizard.styleConciseDesc',
  detailed: 'avatar.wizard.styleDetailedDesc',
  custom: 'avatar.wizard.styleCustomDesc',
}

export interface AvatarScopeSource {
  org_name?: string | null
  dept_name?: string | null
  user_name?: string | null
}

export interface AvatarFormValues {
  name: string
  avatar_url: string
  bio: string
  tags: string[]
  greeting: string
  style: AvatarStyle
  style_custom: string
  tools: string[]
  skills: string[]
  algorithm: string | null
  model: AvatarModelConfig | null
}

interface AvatarEnabledItemSource {
  name: string
  enabled: boolean
}

export interface AvatarFormSource {
  name?: string | null
  avatar_url?: string | null
  bio?: string | null
  tags?: string[] | null
  greeting?: string | null
  style?: AvatarStyle | null
  style_custom?: string | null
  tools?: AvatarEnabledItemSource[] | null
  skills?: AvatarEnabledItemSource[] | null
  algorithms?: AvatarEnabledItemSource[] | null
  algorithm?: string | null
  model?: AvatarModelConfig | null
}

export function formatScope(record: AvatarScopeSource): string {
  const parts = [record.org_name, record.dept_name, record.user_name].filter(
    (value): value is string => Boolean(value?.trim())
  )
  return parts.join(' / ')
}

export function getStyleLabel(
  style: AvatarStyle | string | null | undefined,
  t: (key: string) => string
): string {
  return t(STYLE_LABEL_KEYS[style as AvatarStyle] ?? STYLE_LABEL_KEYS.formal)
}

function getEnabledItemNames(items?: AvatarEnabledItemSource[] | null): string[] {
  if (!items?.length) return []
  return items.filter((item) => item.enabled).map((item) => item.name)
}

export function extractAvatarFormValues(avatar: AvatarFormSource): AvatarFormValues {
  return {
    name: avatar.name ?? '',
    avatar_url: avatar.avatar_url ?? '',
    bio: avatar.bio ?? '',
    tags: avatar.tags ?? [],
    greeting: avatar.greeting ?? '',
    style: avatar.style ?? 'formal',
    style_custom: avatar.style_custom ?? '',
    tools: getEnabledItemNames(avatar.tools),
    skills: getEnabledItemNames(avatar.skills),
    algorithm: avatar.algorithm ?? getEnabledItemNames(avatar.algorithms)[0] ?? null,
    model: avatar.model ?? null,
  }
}
