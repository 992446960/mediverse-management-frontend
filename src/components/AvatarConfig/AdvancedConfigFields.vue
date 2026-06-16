<template>
  <div class="config-section advanced-config-fields" :class="`advanced-config-fields--${variant}`">
    <SectionTitle v-if="variant === 'default'" :title="t('avatar.advanced.title')" />

    <div class="section-content advanced-config-fields__body">
      <template v-if="variant === 'cards'">
        <div class="advanced-chip-grid">
          <a-form-item
            :label="variant === 'cards' ? undefined : t('avatar.advanced.tools')"
            name="tools"
            class="advanced-form-item advanced-form-item--tools"
          >
            <div v-if="variant === 'cards'" class="advanced-card-header">
              <span class="advanced-card-title">
                <span class="advanced-card-icon advanced-card-icon--tools">
                  <ToolOutlined />
                </span>
                <span>{{ t('avatar.advanced.tools') }}</span>
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
            <AdvancedTagList
              :items="selectedToolItems"
              tone="tools"
              :add-text="t('avatar.advanced.addTool')"
              :show-add="false"
              @add="openToolSelector"
              @remove="removeTool"
            />
          </a-form-item>

          <a-form-item
            :label="variant === 'cards' ? undefined : t('avatar.advanced.skills')"
            name="skills"
            class="advanced-form-item advanced-form-item--skills"
          >
            <div v-if="variant === 'cards'" class="advanced-card-header">
              <span class="advanced-card-title">
                <span class="advanced-card-icon advanced-card-icon--skills">
                  <BulbOutlined />
                </span>
                <span>{{ t('avatar.advanced.skills') }}</span>
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
            <AdvancedTagList
              :items="selectedSkillItems"
              tone="skills"
              :add-text="t('avatar.advanced.addSkill')"
              :show-add="false"
              @add="openSkillSelector"
              @remove="removeSkill"
            />
          </a-form-item>
        </div>

        <div class="advanced-select-panel">
          <a-form-item name="algorithm" class="advanced-form-item advanced-form-item--engine">
            <template #label>
              <span class="advanced-field-label">
                <span class="advanced-card-icon advanced-card-icon--engine">
                  <RobotOutlined />
                </span>
                <span>{{ t('avatar.advanced.engine') }}</span>
              </span>
            </template>
            <a-select
              :value="selectedAlgorithm"
              :loading="loading"
              :placeholder="t('avatar.advanced.enginePlaceholder')"
              allow-clear
              @update:value="updateAlgorithm"
            >
              <a-select-option v-for="engine in engines" :key="engine.name" :value="engine.name">
                {{ getEngineLabel(engine) }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item class="advanced-form-item advanced-form-item--model">
            <template #label>
              <span class="advanced-field-label">
                <span class="advanced-card-icon advanced-card-icon--model">
                  <SettingOutlined />
                </span>
                <span>{{ t('avatar.advanced.model') }}</span>
              </span>
            </template>
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
      </template>

      <template v-else>
        <a-form-item
          :label="t('avatar.advanced.tools')"
          name="tools"
          class="advanced-form-item advanced-form-item--tools"
        >
          <AdvancedTagList
            :items="selectedToolItems"
            tone="tools"
            :add-text="t('avatar.advanced.addTool')"
            @add="openToolSelector"
            @remove="removeTool"
          />
        </a-form-item>

        <a-form-item
          :label="t('avatar.advanced.skills')"
          name="skills"
          class="advanced-form-item advanced-form-item--skills"
        >
          <AdvancedTagList
            :items="selectedSkillItems"
            tone="skills"
            :add-text="t('avatar.advanced.addSkill')"
            @add="openSkillSelector"
            @remove="removeSkill"
          />
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
              {{ getEngineLabel(engine) }}
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
      </template>
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
import {
  BulbOutlined,
  PlusOutlined,
  RobotOutlined,
  SettingOutlined,
  ToolOutlined,
} from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import AdvancedTagList from './AdvancedTagList.vue'
import ToolSkillSelector, {
  type ToolSkillSelectorGroup,
  type ToolSkillSelectorItem,
} from './ToolSkillSelector.vue'
import SectionTitle from '@/components/SectionTitle/index.vue'
import type {
  AvatarModelConfig,
  EngineItem,
  ModelGroup,
  SkillItem,
  ToolGroup,
} from '@/types/advancedConfig'
import { getEngineLabel, getProviderLabel } from '@/utils/avatarAdvancedConfig'

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
    variant?: 'default' | 'cards'
  }>(),
  {
    loading: false,
    variant: 'default',
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
.config-section {
  min-width: 0;
}

.advanced-config-fields :deep(.section-title) {
  margin-bottom: var(--spacing-md);
}

.advanced-config-fields__body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-width: 0;
}

.advanced-config-fields--default .advanced-config-fields__body {
  gap: 24px;
}

.advanced-chip-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--spacing-md);
  align-items: start;
  min-width: 0;
}

.advanced-form-item {
  min-width: 0;
  margin-bottom: 0;
  --advanced-chip-color: var(--color-primary);
}

.advanced-form-item--tools {
  --advanced-chip-color: var(--color-primary);
}

.advanced-form-item--skills {
  --advanced-chip-color: #10b981;
}

.advanced-tags-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 8px;
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-base);
  background: var(--color-bg-layout);
}

.advanced-tags-wrap--empty {
  align-items: center;
}

.advanced-config-fields--default .advanced-tags-wrap {
  min-height: 32px;
  padding: 0;
  border: 0;
  background: transparent;
}

.advanced-tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: min(100%, 220px);
  padding: 4px 10px 4px 12px;
  color: var(--advanced-chip-color);
  font-size: 12px;
  border: 1px solid color-mix(in srgb, var(--advanced-chip-color) 42%, transparent);
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--advanced-chip-color) 13%, transparent);
}

.advanced-tag-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.advanced-tag-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  color: var(--advanced-chip-color);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition:
    color var(--transition-fast),
    background var(--transition-fast);
}

.advanced-tag-remove:hover {
  color: var(--advanced-chip-color);
  background: color-mix(in srgb, var(--advanced-chip-color) 16%, transparent);
}

.advanced-tag-remove:focus-visible,
.advanced-tag-add-pill:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.advanced-tag-remove-icon {
  font-size: 10px;
}

.advanced-tag-add-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  line-height: 1.5;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-full);
  background: transparent;
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    color var(--transition-fast);
}

.advanced-tag-add-pill:hover {
  color: var(--color-text-secondary);
  border-color: var(--color-text-tertiary);
}

.advanced-tag-add-icon {
  color: inherit;
  font-size: 12px;
}

.advanced-select-panel {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: var(--spacing-md);
  min-width: 0;
  padding: var(--spacing-md);
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-base);
  background: var(--color-bg-layout);
}

.advanced-config-fields--cards .advanced-config-fields__body {
  gap: 20px;
}

.advanced-config-fields--cards .advanced-chip-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.advanced-config-fields--cards .advanced-form-item {
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-container);
}

.advanced-config-fields--cards .advanced-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-bottom: 12px;
}

.advanced-card-title,
.advanced-field-label {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: var(--spacing-sm);
  color: var(--color-text-base);
  font-weight: 600;
}

.advanced-card-icon {
  display: inline-flex;
  flex: 0 0 42px;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  color: var(--advanced-icon-color);
  background: color-mix(in srgb, var(--advanced-icon-color) 14%, transparent);
  font-size: 1.375rem;
}

.advanced-card-icon--tools,
.advanced-card-icon--engine {
  --advanced-icon-color: var(--color-primary);
}

.advanced-card-icon--skills {
  --advanced-icon-color: #10b981;
}

.advanced-card-icon--model {
  --advanced-icon-color: #64748b;
}

.advanced-config-fields--cards .advanced-tags-wrap {
  align-content: flex-start;
  align-items: flex-start;
  min-height: 40px;
  padding: 0;
  border: 0;
  background: transparent;
}

.advanced-config-fields--cards .advanced-select-panel {
  grid-template-columns: 1fr;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-container);
}

.advanced-config-fields--cards .advanced-select-panel .advanced-form-item {
  display: block;
}

.advanced-config-fields--cards .advanced-select-panel :deep(.ant-form-item-label) {
  padding-bottom: var(--spacing-md);
}

.advanced-config-fields--cards .advanced-form-item--engine,
.advanced-config-fields--cards .advanced-form-item--model {
  padding: 0;
  border: 0;
  background: transparent;
}

.advanced-select-panel :deep(.ant-select) {
  width: 100%;
}

.advanced-model-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  min-width: 0;
}

.advanced-config-fields--default .advanced-model-grid {
  grid-template-columns: minmax(180px, 240px) minmax(220px, 1fr);
  gap: 12px;
}

@media (max-width: 640px) {
  .advanced-chip-grid,
  .advanced-config-fields--cards .advanced-chip-grid {
    grid-template-columns: 1fr;
  }

  .advanced-model-grid {
    grid-template-columns: 1fr;
  }
}
</style>
