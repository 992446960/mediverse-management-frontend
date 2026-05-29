import type {
  AvatarAdvancedEnabledItem,
  AvatarModelConfig,
  EngineItem,
  ModelGroup,
  SkillItem,
  ToolGroup,
} from '@/types/advancedConfig'
import type { AvatarWizardForm, CreateAvatarParams } from '@/types/avatar'
import type { Skill } from '@/types/skill'

export function getEnabledNames(items?: AvatarAdvancedEnabledItem[] | null): string[] {
  if (!items?.length) return []
  return items.filter((item) => item.enabled).map((item) => item.name)
}

export function getDefaultEngineName(
  savedAlgorithm: string | null | undefined,
  engines: EngineItem[]
): string | null {
  const saved = savedAlgorithm?.trim()
  if (saved) return saved
  return engines.find((engine) => engine.default)?.name ?? engines[0]?.name ?? null
}

export function getEngineLabel(engine: EngineItem): string {
  const name = engine.name.trim()
  const description = engine.description.trim()
  if (!description) return name
  if (!name || name === description) return description
  return `${description}（${name}）`
}

export function resolveModelSelection(
  savedModel: AvatarModelConfig | null | undefined,
  groups: ModelGroup[]
): AvatarModelConfig | null {
  const savedProvider = savedModel?.provider?.trim()
  const savedModelId = savedModel?.model_id?.trim()
  if (savedProvider && savedModelId) {
    const matched = groups
      .find((group) => group.provider === savedProvider)
      ?.items.some((item) => item.id === savedModelId)
    if (matched) {
      return {
        provider: savedProvider,
        model_id: savedModelId,
      }
    }
  }

  const firstGroup = groups.find((group) => group.items.length > 0)
  const firstModel = firstGroup?.items[0]
  if (!firstGroup || !firstModel) return null
  return {
    provider: firstGroup.provider,
    model_id: firstModel.id,
  }
}

export function normalizeSkillOptions(skills: Skill[]): SkillItem[] {
  return skills.flatMap((skill) => {
    const name = (skill.name || skill.skill_code || '').trim()
    if (!name) return []
    const label = (skill.title || name).trim()
    return [
      {
        name,
        label,
        description: (skill.description || label).trim(),
      },
    ]
  })
}

export function getProviderLabel(provider: string): string {
  const labelMap: Record<string, string> = {
    openai: 'GPT 系列 (OpenAI)',
    anthropic: 'Claude 系列 (Anthropic)',
    deepseek: 'DeepSeek 系列',
  }
  return labelMap[provider] ?? provider
}

export interface AdvancedConfigSummarySource {
  tools?: AvatarAdvancedEnabledItem[] | null
  skills?: AvatarAdvancedEnabledItem[] | null
  algorithms?: AvatarAdvancedEnabledItem[] | null
  algorithm?: string | null
  model?: AvatarModelConfig | null
}

export interface AdvancedConfigSummaryOptions {
  tools?: ToolGroup[]
  skills?: SkillItem[]
  engines?: EngineItem[]
  modelGroups?: ModelGroup[]
  emptyText?: string
}

export interface AdvancedConfigSummary {
  tools: string[]
  skills: string[]
  algorithm: string
  model: string
}

export function resolveAdvancedConfigSummary(
  source: AdvancedConfigSummarySource,
  options: AdvancedConfigSummaryOptions = {}
): AdvancedConfigSummary {
  const emptyText = options.emptyText ?? '—'
  const toolLabelMap = new Map(
    (options.tools ?? []).flatMap((group) =>
      group.items.map((item) => [item.name, item.name] as const)
    )
  )
  const skillLabelMap = new Map(
    (options.skills ?? []).map((item) => [item.name, item.label ?? item.name])
  )
  const engineLabelMap = new Map(
    (options.engines ?? []).map((item) => [item.name, getEngineLabel(item)])
  )

  const toolNames = getEnabledNames(source.tools)
  const skillNames = getEnabledNames(source.skills)
  const algorithmName = source.algorithm ?? getEnabledNames(source.algorithms)[0] ?? ''
  const model = source.model
  const modelItem = model
    ? options.modelGroups
        ?.find((group) => group.provider === model.provider)
        ?.items.find((item) => item.id === model.model_id)
    : undefined

  return {
    tools: toolNames.map((name) => toolLabelMap.get(name) ?? name),
    skills: skillNames.map((name) => skillLabelMap.get(name) ?? name),
    algorithm: algorithmName ? (engineLabelMap.get(algorithmName) ?? algorithmName) : emptyText,
    model: model
      ? `${getProviderLabel(model.provider)} / ${modelItem?.name ?? model.model_id}`
      : emptyText,
  }
}

export function buildAvatarCreatePayload(form: AvatarWizardForm): CreateAvatarParams {
  return {
    type: form.type,
    org_id: form.org_id,
    dept_id: form.dept_id,
    user_id: form.user_id,
    name: form.name.trim(),
    avatar_url: form.avatar_url?.trim() || undefined,
    bio: form.bio?.trim() || undefined,
    tags: form.tags?.length ? form.tags : undefined,
    greeting: form.greeting?.trim() || undefined,
    style: form.style,
    style_custom: form.style === 'custom' ? form.style_custom?.trim() || undefined : undefined,
    tools: form.tools ?? [],
    skills: form.skills ?? [],
    algorithm: form.algorithm ?? null,
    model: form.model ?? null,
  }
}
