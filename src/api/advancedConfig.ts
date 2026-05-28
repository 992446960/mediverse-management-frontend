import { request } from '@/api/index'
import type { EngineItem, ModelGroup, ToolGroup } from '@/types/advancedConfig'

export function getTools(params?: { category?: string }) {
  return request.get<ToolGroup[]>('/tools', { params })
}

export function getEngines() {
  return request.get<EngineItem[]>('/engines')
}

export function getModels(params?: { provider?: string }) {
  return request.get<ModelGroup[]>('/models', { params })
}
