export interface ToolItem {
  name: string
  description: string
  category: string
}

export interface ToolGroup {
  category: string
  items: ToolItem[]
}

export interface SkillItem {
  name: string
  description: string
  label?: string
}

export interface EngineItem {
  name: string
  description: string
  default: boolean
  version: string
}

export interface ModelItem {
  id: string
  name: string
  provider: string
  api: string
  reasoning: boolean
  input: string[]
  context_window: number
  max_tokens: number
  cost_input?: number | null
  cost_output?: number | null
}

export interface ModelGroup {
  provider: string
  items: ModelItem[]
}

export interface AvatarModelConfig {
  provider: string
  model_id: string
}

export interface AvatarAdvancedEnabledItem {
  name: string
  enabled: boolean
}
