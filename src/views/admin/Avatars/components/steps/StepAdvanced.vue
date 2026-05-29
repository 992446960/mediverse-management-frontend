<template>
  <div class="step-advanced">
    <section class="step-advanced__panel">
      <SectionTitle :title="t('avatar.advanced.title')" />
      <div class="step-advanced__body">
        <a-form layout="vertical" :model="modelValue">
          <AdvancedConfigFields
            :selected-tools="modelValue.tools"
            :selected-skills="modelValue.skills"
            :selected-algorithm="modelValue.algorithm"
            :selected-model="modelValue.model"
            :tools="toolGroups"
            :skills="skillOptions"
            :engines="engineOptions"
            :model-groups="modelGroups"
            :loading="advancedLoading"
            @update:selected-tools="updateField('tools', $event)"
            @update:selected-skills="updateField('skills', $event)"
            @update:selected-algorithm="updateField('algorithm', $event)"
            @update:selected-model="updateField('model', $event)"
          />
        </a-form>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import AdvancedConfigFields from '@/components/AvatarConfig/AdvancedConfigFields.vue'
import SectionTitle from '@/components/SectionTitle/index.vue'
import { getEngines, getModels, getTools } from '@/api/advancedConfig'
import { getSkills } from '@/api/skills'
import type { EngineItem, ModelGroup, SkillItem, ToolGroup } from '@/types/advancedConfig'
import type { AvatarWizardForm } from '@/types/avatar'
import {
  getDefaultEngineName,
  normalizeSkillOptions,
  resolveModelSelection,
} from '@/utils/avatarAdvancedConfig'

const { t } = useI18n()

const props = defineProps<{
  modelValue: AvatarWizardForm
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AvatarWizardForm]
}>()

const advancedLoading = ref(false)
const advancedLoaded = ref(false)
const toolGroups = ref<ToolGroup[]>([])
const skillOptions = ref<SkillItem[]>([])
const engineOptions = ref<EngineItem[]>([])
const modelGroups = ref<ModelGroup[]>([])

function updateField<K extends keyof AvatarWizardForm>(key: K, value: AvatarWizardForm[K]) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  })
}

function applyAdvancedDefaults() {
  const algorithm = getDefaultEngineName(props.modelValue.algorithm, engineOptions.value)
  const model = resolveModelSelection(props.modelValue.model, modelGroups.value)
  if (algorithm === props.modelValue.algorithm && model === props.modelValue.model) return
  emit('update:modelValue', {
    ...props.modelValue,
    algorithm,
    model,
  })
}

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
    applyAdvancedDefaults()
  } catch (err) {
    console.error('Failed to fetch advanced avatar config options:', err)
  } finally {
    advancedLoading.value = false
  }
}

onMounted(loadAdvancedOptions)
</script>

<style scoped lang="scss">
.step-advanced__panel {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-container);
}

.step-advanced__panel :deep(.section-title) {
  margin-bottom: var(--spacing-md);
}

.step-advanced__body {
  min-width: 0;
}

.step-advanced :deep(.config-section) {
  padding: 0;
  background: transparent;
}

.step-advanced :deep(.section-header) {
  display: none;
}
</style>
