import { isRef } from 'vue'
import type { Ref } from 'vue'
import { getEngines, getModels, getTools } from '@/api/advancedConfig'
import { getSkills } from '@/api/skills'
import type {
  AvatarModelConfig,
  EngineItem,
  ModelGroup,
  SkillItem,
  ToolGroup,
} from '@/types/advancedConfig'
import {
  getDefaultEngineName,
  normalizeSkillOptions,
  resolveModelSelection,
} from '@/utils/avatarAdvancedConfig'

export interface AdvancedConfigFormTarget {
  algorithm: string | null
  model: AvatarModelConfig | null
}

export function useAdvancedConfigOptions() {
  const toolGroups = ref<ToolGroup[]>([])
  const skillOptions = ref<SkillItem[]>([])
  const engineOptions = ref<EngineItem[]>([])
  const modelGroups = ref<ModelGroup[]>([])
  const advancedLoading = ref(false)
  const advancedLoaded = ref(false)

  async function loadAdvancedOptions() {
    if (advancedLoaded.value) return
    advancedLoading.value = true
    try {
      const [tools, skills, engines, models] = await Promise.all([
        getTools(),
        getSkills(),
        getEngines(),
        getModels(),
      ])
      toolGroups.value = tools
      skillOptions.value = normalizeSkillOptions(skills)
      engineOptions.value = engines
      modelGroups.value = models
      advancedLoaded.value = true
    } finally {
      advancedLoading.value = false
    }
  }

  function applyAdvancedDefaults(form: Ref<AdvancedConfigFormTarget> | AdvancedConfigFormTarget) {
    const source = isRef(form) ? form.value : form
    const next = {
      algorithm: getDefaultEngineName(source.algorithm, engineOptions.value),
      model: resolveModelSelection(source.model, modelGroups.value),
    }

    if (isRef(form)) {
      form.value = { ...form.value, ...next }
      return
    }

    Object.assign(form, next)
  }

  return {
    toolGroups,
    skillOptions,
    engineOptions,
    modelGroups,
    advancedLoading,
    advancedLoaded,
    loadAdvancedOptions,
    applyAdvancedDefaults,
  }
}
