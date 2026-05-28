<template>
  <div class="config-section">
    <div class="section-header">
      <span class="section-title">{{ t('avatar.advanced.title') }}</span>
    </div>

    <div class="section-content space-y-6">
      <a-form-item :label="t('avatar.advanced.tools')" name="tools">
        <div class="advanced-tags-wrap">
          <span v-for="item in selectedToolItems" :key="item.name" class="advanced-tag-pill">
            <span class="advanced-tag-text">{{ item.label || item.name }}</span>
            <span class="advanced-tag-remove" @click="removeTool(item.name)">
              <CloseOutlined class="advanced-tag-remove-icon" />
            </span>
          </span>
          <button
            type="button"
            class="advanced-tag-add-pill"
            @click.stop.prevent="openToolSelector"
          >
            <PlusOutlined class="advanced-tag-add-icon" />
            <span>{{ t('avatar.advanced.addTool') }}</span>
          </button>
        </div>
      </a-form-item>

      <a-form-item :label="t('avatar.advanced.skills')" name="skills">
        <div class="advanced-tags-wrap">
          <span v-for="item in selectedSkillItems" :key="item.name" class="advanced-tag-pill">
            <span class="advanced-tag-text">{{ item.label || item.name }}</span>
            <span class="advanced-tag-remove" @click="removeSkill(item.name)">
              <CloseOutlined class="advanced-tag-remove-icon" />
            </span>
          </span>
          <button
            type="button"
            class="advanced-tag-add-pill"
            @click.stop.prevent="openSkillSelector"
          >
            <PlusOutlined class="advanced-tag-add-icon" />
            <span>{{ t('avatar.advanced.addSkill') }}</span>
          </button>
        </div>
      </a-form-item>

      <a-form-item :label="t('avatar.advanced.engine')" name="algorithm">
        <a-select
          :value="selectedAlgorithm"
          :loading="loading"
          :placeholder="t('avatar.advanced.enginePlaceholder')"
          allow-clear
          @update:value="updateAlgorithm"
        >
          <a-select-option v-for="engine in engines" :key="engine.name" :value="engine.name">
            {{ engine.description }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item :label="t('avatar.advanced.model')">
        <div class="advanced-model-grid">
          <a-select
            :value="selectedModel?.provider"
            :loading="loading"
            :placeholder="t('avatar.advanced.providerPlaceholder')"
            @update:value="updateProvider"
          >
            <a-select-option
              v-for="group in modelGroups"
              :key="group.provider"
              :value="group.provider"
            >
              {{ getProviderLabel(group.provider) }}
            </a-select-option>
          </a-select>
          <a-select
            :value="selectedModel?.model_id"
            :loading="loading"
            :disabled="!selectedModel?.provider"
            :placeholder="t('avatar.advanced.modelPlaceholder')"
            @update:value="updateModel"
          >
            <a-select-option v-for="model in currentModels" :key="model.id" :value="model.id">
              {{ model.name }}
            </a-select-option>
          </a-select>
        </div>
      </a-form-item>
    </div>

    <ToolSkillSelector
      v-model:open="toolSelectorOpen"
      :title="t('avatar.advanced.selectTool')"
      :search-placeholder="t('avatar.advanced.searchTool')"
      :groups="toolSelectorGroups"
      :selected-keys="selectedTools"
      show-groups
      @confirm="updateTools"
    />
    <ToolSkillSelector
      v-model:open="skillSelectorOpen"
      :title="t('avatar.advanced.selectSkill')"
      :search-placeholder="t('avatar.advanced.searchSkill')"
      :groups="skillSelectorGroups"
      :selected-keys="selectedSkills"
      @confirm="updateSkills"
    />
  </div>
</template>

<script setup lang="ts">
import { CloseOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import ToolSkillSelector, {
  type ToolSkillSelectorGroup,
  type ToolSkillSelectorItem,
} from './ToolSkillSelector.vue'
import type {
  AvatarModelConfig,
  EngineItem,
  ModelGroup,
  SkillItem,
  ToolGroup,
} from '@/types/advancedConfig'
import { getProviderLabel } from '@/utils/avatarAdvancedConfig'

const props = withDefaults(
  defineProps<{
    selectedTools: string[]
    selectedSkills: string[]
    selectedAlgorithm: string | null
    selectedModel: AvatarModelConfig | null
    tools: ToolGroup[]
    skills: SkillItem[]
    engines: EngineItem[]
    modelGroups: ModelGroup[]
    loading?: boolean
  }>(),
  {
    loading: false,
  }
)

const emit = defineEmits<{
  'update:selectedTools': [value: string[]]
  'update:selectedSkills': [value: string[]]
  'update:selectedAlgorithm': [value: string | null]
  'update:selectedModel': [value: AvatarModelConfig | null]
}>()

const { t } = useI18n()
const toolSelectorOpen = ref(false)
const skillSelectorOpen = ref(false)

const toolItems = computed<ToolSkillSelectorItem[]>(() =>
  props.tools.flatMap((group) =>
    group.items.map((item) => ({
      name: item.name,
      description: item.description,
      category: item.category || group.category,
    }))
  )
)

const skillItems = computed<ToolSkillSelectorItem[]>(() =>
  props.skills.map((item) => ({
    name: item.name,
    label: item.label,
    description: item.description,
  }))
)

const toolSelectorGroups = computed<ToolSkillSelectorGroup[]>(() =>
  props.tools.map((group) => ({
    key: group.category,
    label: group.category,
    items: group.items.map((item) => ({
      name: item.name,
      description: item.description,
      category: item.category || group.category,
    })),
  }))
)

const skillSelectorGroups = computed<ToolSkillSelectorGroup[]>(() => [
  {
    key: 'skills',
    label: t('avatar.advanced.skills'),
    items: skillItems.value,
  },
])

const selectedToolItems = computed(() => resolveSelectedItems(props.selectedTools, toolItems.value))
const selectedSkillItems = computed(() =>
  resolveSelectedItems(props.selectedSkills, skillItems.value)
)

const currentModels = computed(
  () =>
    props.modelGroups.find((group) => group.provider === props.selectedModel?.provider)?.items ?? []
)

function resolveSelectedItems(selected: string[], items: ToolSkillSelectorItem[]) {
  return selected.map(
    (name) =>
      items.find((item) => item.name === name) ?? {
        name,
        description: '',
      }
  )
}

function updateTools(value: string[]) {
  emit('update:selectedTools', value)
}

function updateSkills(value: string[]) {
  emit('update:selectedSkills', value)
}

function openToolSelector() {
  toolSelectorOpen.value = true
}

function openSkillSelector() {
  skillSelectorOpen.value = true
}

function removeTool(name: string) {
  emit(
    'update:selectedTools',
    props.selectedTools.filter((item) => item !== name)
  )
}

function removeSkill(name: string) {
  emit(
    'update:selectedSkills',
    props.selectedSkills.filter((item) => item !== name)
  )
}

function updateAlgorithm(value: string | undefined) {
  emit('update:selectedAlgorithm', value || null)
}

function updateProvider(provider: string) {
  const model = props.modelGroups.find((group) => group.provider === provider)?.items[0]
  emit('update:selectedModel', model ? { provider, model_id: model.id } : null)
}

function updateModel(modelId: string) {
  const provider = props.selectedModel?.provider
  if (!provider) return
  emit('update:selectedModel', { provider, model_id: modelId })
}
</script>

<style scoped lang="scss">
@reference "../../styles/index.css";

.config-section {
  @apply bg-white dark:bg-gray-800 rounded-lg;
}

.section-header {
  @apply flex items-center mb-4 pl-3 border-l-4 border-[#0ea5e9];
}

.section-title {
  @apply text-base font-medium text-gray-900 dark:text-gray-100;
}

.advanced-tags-wrap {
  @apply flex flex-wrap items-center gap-2 min-h-[32px];
}

.advanced-tag-pill {
  @apply inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0ea5e9]/10 border border-[#0ea5e9]/40 text-[#0ea5e9] text-xs;
  max-width: 240px;
}

.advanced-tag-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.advanced-tag-remove {
  @apply inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-[#0ea5e9]/20 cursor-pointer shrink-0;
}

.advanced-tag-remove-icon {
  @apply text-[10px];
}

.advanced-tag-add-pill {
  @apply inline-flex items-center gap-1 px-3 py-1 rounded-full border border-dashed border-gray-300 dark:border-gray-600 bg-transparent
         text-gray-400 text-xs cursor-pointer hover:border-gray-400 hover:text-gray-500 transition-colors;
}

.advanced-tag-add-icon {
  @apply text-xs;
}

.advanced-model-grid {
  display: grid;
  grid-template-columns: minmax(180px, 240px) minmax(220px, 1fr);
  gap: 12px;
}

@media (max-width: 640px) {
  .advanced-model-grid {
    grid-template-columns: 1fr;
  }
}
</style>
