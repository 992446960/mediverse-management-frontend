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
            variant="cards"
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
import { useAdvancedConfigOptions } from '@/composables/useAdvancedConfigOptions'
import type { AvatarWizardForm } from '@/types/avatar'

const { t } = useI18n()

const props = defineProps<{
  modelValue: AvatarWizardForm
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AvatarWizardForm]
}>()

const {
  toolGroups,
  skillOptions,
  engineOptions,
  modelGroups,
  advancedLoading,
  loadAdvancedOptions,
  applyAdvancedDefaults,
} = useAdvancedConfigOptions()

function updateField<K extends keyof AvatarWizardForm>(key: K, value: AvatarWizardForm[K]) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  })
}

function applyDefaultsToModelValue() {
  const next = { ...props.modelValue }
  applyAdvancedDefaults(next)
  const sameModel =
    next.model?.provider === props.modelValue.model?.provider &&
    next.model?.model_id === props.modelValue.model?.model_id
  if (next.algorithm === props.modelValue.algorithm && sameModel) return
  emit('update:modelValue', next)
}

async function loadOptionsAndDefaults() {
  try {
    await loadAdvancedOptions()
    applyDefaultsToModelValue()
  } catch (err) {
    console.error('Failed to fetch advanced avatar config options:', err)
  }
}

onMounted(loadOptionsAndDefaults)
</script>

<style scoped lang="scss">
.step-advanced__panel {
  padding: 20px;
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
