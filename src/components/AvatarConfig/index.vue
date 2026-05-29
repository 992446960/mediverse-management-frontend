<template>
  <div class="avatar-config">
    <a-spin :spinning="loading">
      <a-form ref="formRef" :model="formData" layout="vertical" class="avatar-config-form">
        <div class="avatar-config-layout">
          <aside class="avatar-config-layout__rail">
            <input
              ref="fileInputRef"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style="display: none"
              aria-hidden="true"
              @change="onAvatarFileChange"
            />
            <AvatarUploadPanel
              :image-url="formData.avatar_url || ''"
              :title="t('avatar.avatar')"
              :action-text="t('common.selectFile')"
              :hint="t('avatar.wizard.avatarSizeHint') + '，' + t('avatar.wizard.avatarFormatHint')"
              :loading="avatarUploading"
              @upload="triggerAvatarFileInput"
            />
          </aside>

          <div class="avatar-config-layout__content">
            <section class="avatar-config-section">
              <SectionTitle :title="t('avatar.wizard.config.basicInfo')" />
              <div class="avatar-config-section__body">
                <a-form-item
                  :label="t('avatar.name')"
                  name="name"
                  :rules="[
                    {
                      required: true,
                      whitespace: true,
                      message: t('avatar.name') + ' ' + t('common.required'),
                      trigger: 'blur',
                    },
                  ]"
                >
                  <a-input
                    v-model:value="formData.name"
                    :placeholder="t('avatar.wizard.config.placeholderName')"
                    :maxlength="100"
                    show-count
                  />
                </a-form-item>

                <a-form-item :label="t('avatar.bio')" name="bio">
                  <a-textarea
                    v-model:value="formData.bio"
                    :placeholder="t('avatar.wizard.config.placeholderBio')"
                    :rows="3"
                    :maxlength="500"
                    show-count
                  />
                </a-form-item>

                <a-form-item name="tags">
                  <template #label>
                    <span class="step-info-label">{{ t('avatar.tags') }}</span>
                  </template>
                  <div class="step-info-tags-wrap">
                    <template v-for="(tag, index) in formData.tags" :key="`${tag}-${index}`">
                      <span class="step-info-tag-pill">
                        <span class="step-info-tag-text">{{ tag }}</span>
                        <span
                          class="step-info-tag-remove"
                          role="button"
                          tabindex="0"
                          :aria-label="t('common.delete')"
                          @click="removeTag(index)"
                          @keydown.enter.prevent="removeTag(index)"
                          @keydown.space.prevent="removeTag(index)"
                        >
                          <CloseOutlined class="step-info-tag-remove-icon" />
                        </span>
                      </span>
                    </template>

                    <a-popover
                      v-model:open="tagPopoverVisible"
                      trigger="click"
                      placement="bottomLeft"
                    >
                      <template #content>
                        <div class="step-info-tag-add-popover">
                          <a-input
                            v-model:value="newTag"
                            :placeholder="t('avatar.wizard.tagPlaceholder')"
                            :maxlength="20"
                            size="small"
                            class="w-48"
                            @press-enter="addTag"
                          />
                          <a-button type="primary" size="small" class="mt-2 w-full" @click="addTag">
                            {{ t('common.add') }}
                          </a-button>
                        </div>
                      </template>
                      <span
                        class="step-info-tag-add-pill"
                        role="button"
                        tabindex="0"
                        :aria-label="t('avatar.wizard.addTag')"
                        @keydown.enter.prevent="tagPopoverVisible = true"
                        @keydown.space.prevent="tagPopoverVisible = true"
                      >
                        <PlusOutlined class="step-info-tag-add-icon" />
                        <span>{{ t('avatar.wizard.tagPlaceholderAdd') }}</span>
                      </span>
                    </a-popover>
                  </div>
                </a-form-item>
              </div>
            </section>

            <section class="avatar-config-section">
              <SectionTitle :title="t('avatar.wizard.config.dialogStrategy')" />
              <div class="avatar-config-section__body">
                <a-form-item :label="t('avatar.greeting')" name="greeting">
                  <a-textarea
                    v-model:value="formData.greeting"
                    :placeholder="t('avatar.wizard.config.placeholderGreeting')"
                    :rows="2"
                    :maxlength="200"
                    show-count
                  />
                </a-form-item>

                <a-form-item :label="t('avatar.style')" name="style">
                  <a-radio-group v-model:value="formData.style" class="step-info-style-group">
                    <a-radio
                      v-for="opt in styleOptions"
                      :key="opt.value"
                      :value="opt.value"
                      class="step-info-style-card"
                      :class="{ 'step-info-style-card--selected': formData.style === opt.value }"
                    >
                      <span class="step-info-style-card__content">
                        <component :is="opt.icon" class="step-info-style-card__icon" />
                        <span>{{ t(opt.labelKey) }}</span>
                      </span>
                    </a-radio>
                  </a-radio-group>
                </a-form-item>

                <a-form-item
                  v-if="formData.style === 'custom'"
                  :label="t('avatar.styleCustom')"
                  name="style_custom"
                >
                  <a-input
                    :value="formData.style_custom ?? ''"
                    :placeholder="t('avatar.styleCustom')"
                    :maxlength="100"
                    show-count
                    allow-clear
                    @update:value="onStyleCustomUpdate"
                  />
                </a-form-item>
              </div>
            </section>

            <section class="avatar-config-section avatar-config-section--advanced">
              <SectionTitle :title="t('avatar.advanced.title')" />
              <div class="avatar-config-section__body">
                <AdvancedConfigFields
                  :selected-tools="formData.tools"
                  :selected-skills="formData.skills"
                  :selected-algorithm="formData.algorithm"
                  :selected-model="formData.model"
                  :tools="toolGroups"
                  :skills="skillOptions"
                  :engines="engineOptions"
                  :model-groups="modelGroups"
                  :loading="advancedLoading"
                  @update:selected-tools="formData.tools = $event"
                  @update:selected-skills="formData.skills = $event"
                  @update:selected-algorithm="formData.algorithm = $event"
                  @update:selected-model="formData.model = $event"
                />
              </div>
            </section>

            <div class="avatar-config-footer">
              <a-button @click="emit('cancel')">{{ t('common.cancel') }}</a-button>
              <a-button type="primary" :loading="saving" @click="handleSave">
                {{ t('common.save') }}
              </a-button>
            </div>
          </div>
        </div>
      </a-form>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  CloseOutlined,
  FileTextOutlined,
  MessageOutlined,
  PlusOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import AdvancedConfigFields from './AdvancedConfigFields.vue'
import AvatarUploadPanel from '@/components/AvatarUploadPanel/index.vue'
import SectionTitle from '@/components/SectionTitle/index.vue'
import type { OwnerType } from '@/constants/avatar'
import type { UpdateAvatarConfigParams } from '@/types/avatarConfig'
import type { AvatarStyle, UpdateAvatarParams } from '@/types/avatar'
import type { Component } from 'vue'
import type {
  AvatarModelConfig,
  EngineItem,
  ModelGroup,
  SkillItem,
  ToolGroup,
} from '@/types/advancedConfig'
import { getEngines, getModels, getTools } from '@/api/advancedConfig'
import { getAvatarConfig, updateMyAvatarConfig } from '@/api/avatarConfig'
import { getAvatarDetail, updateAvatar } from '@/api/avatars'
import { getSkills } from '@/api/skills'
import { uploadAvatar } from '@/api/upload'
import {
  getDefaultEngineName,
  getEnabledNames,
  normalizeSkillOptions,
  resolveModelSelection,
} from '@/utils/avatarAdvancedConfig'

const props = defineProps<{
  ownerType: OwnerType
  ownerId?: string
  readonly?: boolean
  /** 已知分身 ID 时走后台分身接口；否则走当前工作台分身配置接口 */
  avatarId?: string
}>()

const emit = defineEmits<{
  (e: 'saved'): void
  (e: 'cancel'): void
}>()

const { t } = useI18n()
const loading = ref(false)
const saving = ref(false)
const formRef = ref()
const fileInputRef = ref<HTMLInputElement>()
const tagPopoverVisible = ref(false)
const newTag = ref('')
const avatarUploading = ref(false)
const advancedLoading = ref(false)
const advancedLoaded = ref(false)
const toolGroups = ref<ToolGroup[]>([])
const skillOptions = ref<SkillItem[]>([])
const engineOptions = ref<EngineItem[]>([])
const modelGroups = ref<ModelGroup[]>([])

const AVATAR_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp'

interface AvatarConfigFormData extends UpdateAvatarConfigParams {
  tags: string[]
  tools: string[]
  skills: string[]
  algorithm: string | null
  model: AvatarModelConfig | null
}

const formData = reactive<AvatarConfigFormData>({
  name: '',
  avatar_url: '',
  bio: '',
  greeting: '',
  style: 'formal',
  style_custom: null,
  tags: [],
  tools: [],
  skills: [],
  algorithm: null,
  model: null,
})

const styleOptions = [
  { value: 'formal', labelKey: 'avatar.wizard.styleFormal', icon: UserOutlined },
  { value: 'friendly', labelKey: 'avatar.wizard.styleFriendly', icon: MessageOutlined },
  { value: 'concise', labelKey: 'avatar.wizard.styleConcise', icon: ThunderboltOutlined },
  { value: 'detailed', labelKey: 'avatar.wizard.styleDetailed', icon: FileTextOutlined },
  { value: 'custom', labelKey: 'avatar.wizard.styleCustom', icon: SettingOutlined },
] satisfies { value: AvatarStyle; labelKey: string; icon: Component }[]

/** 保存时使用的分身 id（来自 props.avatarId 或 GET /my/avatar 返回的 id） */
const effectiveAvatarId = ref<string | null>(null)

function assignFormFromDetail(res: {
  name: string
  avatar_url: string | null
  bio: string | null
  greeting: string | null
  style: AvatarStyle
  style_custom?: string | null
  tags?: string[]
  tools?: Array<{ name: string; enabled: boolean }>
  skills?: Array<{ name: string; enabled: boolean }>
  algorithms?: Array<{ name: string; enabled: boolean }>
  algorithm?: string | null
  model?: UpdateAvatarConfigParams['model']
}) {
  Object.assign(formData, {
    name: res.name,
    avatar_url: res.avatar_url,
    bio: res.bio,
    greeting: res.greeting,
    style: res.style,
    style_custom: res.style_custom ?? null,
    tags: res.tags || [],
    tools: getEnabledNames(res.tools),
    skills: getEnabledNames(res.skills),
    algorithm: res.algorithm ?? getEnabledNames(res.algorithms)[0] ?? null,
    model: res.model ?? null,
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
  } catch (err) {
    console.error('Failed to fetch advanced avatar config options:', err)
  } finally {
    advancedLoading.value = false
  }
}

function applyAdvancedDefaults() {
  formData.algorithm = getDefaultEngineName(formData.algorithm, engineOptions.value)
  formData.model = resolveModelSelection(formData.model, modelGroups.value)
}

const fetchConfig = async () => {
  const explicitId = props.avatarId?.trim()
  if (!props.ownerId && !explicitId) return
  loading.value = true
  try {
    await Promise.all([
      (async () => {
        if (explicitId) {
          const res = await getAvatarDetail(explicitId)
          assignFormFromDetail(res)
          effectiveAvatarId.value = explicitId
        } else if (props.ownerId) {
          const res = await getAvatarConfig(props.ownerType, props.ownerId)
          assignFormFromDetail(res)
          effectiveAvatarId.value = res.id?.trim() || null
        }
      })(),
      loadAdvancedOptions(),
    ])
    applyAdvancedDefaults()
  } catch (err) {
    console.error('Failed to fetch avatar config:', err)
  } finally {
    loading.value = false
  }
}

/** 提交时随表单携带的字段（含 name，避免后端按部分更新把名称清空） */
const UPDATE_ALLOWED_KEYS = [
  'name',
  'bio',
  'tags',
  'greeting',
  'style',
  'style_custom',
  'avatar_url',
  'tools',
  'skills',
  'algorithm',
  'model',
] as const

const handleSave = async () => {
  try {
    await formRef.value.validate()
    saving.value = true
    const payload = Object.fromEntries(
      UPDATE_ALLOWED_KEYS.map((k) => {
        const v = formData[k] as unknown
        if (k === 'name' && typeof v === 'string') return [k, v.trim()]
        return [k, v]
      })
    ) as UpdateAvatarParams
    const explicitId = props.avatarId?.trim()
    if (explicitId) {
      const id = effectiveAvatarId.value?.trim()
      if (!id) {
        message.error(t('avatar.configSaveMissingAvatarId'))
        return
      }
      await updateAvatar(id, payload)
    } else {
      await updateMyAvatarConfig(payload)
    }
    message.success(t('common.success'))
    emit('saved')
  } catch (err) {
    console.error('Failed to save avatar config:', err)
  } finally {
    saving.value = false
  }
}

function triggerAvatarFileInput() {
  fileInputRef.value?.click()
}

const onAvatarFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const type = file.type
  if (
    !AVATAR_ACCEPT.split(',')
      .map((s) => s.trim())
      .includes(type)
  )
    return
  avatarUploading.value = true
  try {
    const res = await uploadAvatar(file)
    formData.avatar_url = res.url
  } catch {
    message.error(t('common.error'))
  } finally {
    avatarUploading.value = false
  }
}

function onStyleCustomUpdate(v: string) {
  formData.style_custom = v?.trim() ? v : null
}

const removeTag = (index: number) => {
  formData.tags.splice(index, 1)
}

const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !formData.tags.includes(tag)) {
    formData.tags.push(tag)
  }
  newTag.value = ''
  tagPopoverVisible.value = false
}

watch(
  () => [props.ownerType, props.ownerId, props.avatarId],
  () => {
    fetchConfig()
  }
)
onMounted(fetchConfig)
</script>

<style scoped lang="scss">
.avatar-config-form {
  min-width: 0;
}

.avatar-config-layout {
  display: grid;
  grid-template-columns: minmax(220px, 260px) minmax(0, 1fr);
  gap: var(--spacing-lg);
  align-items: start;
}

.avatar-config-layout__rail {
  position: sticky;
  top: 0;
}

.avatar-config-layout__rail :deep(.avatar-upload-panel) {
  align-items: flex-start;
}

.avatar-config-layout__rail :deep(.avatar-upload-panel__hint) {
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
}

.avatar-config-layout__content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.avatar-config-section {
  min-width: 0;
}

.avatar-config-section :deep(.section-title) {
  margin-bottom: var(--spacing-md);
}

.avatar-config-section__body {
  min-width: 0;
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-container);
}

.avatar-config-section__body :deep(.ant-form-item:last-child) {
  margin-bottom: 0;
}

.avatar-config-section--advanced :deep(.config-section) {
  padding: 0;
  background: transparent;
}

.avatar-config-section--advanced :deep(.section-header) {
  display: none;
}

.avatar-config :deep(.ant-form-item-control-input-content) {
  display: block;
}

.avatar-config :deep(.ant-input:focus),
.avatar-config :deep(.ant-input:focus-visible),
.avatar-config :deep(.ant-input-affix-wrapper-focused),
.avatar-config :deep(.ant-select-focused .ant-select-selector) {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent);
}

.step-info-label {
  display: inline-block;
}

.step-info-tags-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: 32px;
}

.step-info-tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 180px;
  padding: 4px 10px 4px 12px;
  color: var(--color-primary);
  font-size: 12px;
  border: 1px solid color-mix(in srgb, var(--color-primary) 40%, transparent);
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
}

.step-info-tag-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-info-tag-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  color: var(--color-primary);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition:
    color var(--transition-fast),
    background var(--transition-fast);
}

.step-info-tag-remove:hover {
  color: var(--color-primary-hover);
  background: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.step-info-tag-remove:focus-visible,
.step-info-tag-add-pill:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.step-info-tag-remove-icon {
  font-size: 10px;
}

.step-info-tag-add-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  color: var(--color-text-tertiary);
  font-size: 12px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-full);
  background: transparent;
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    color var(--transition-fast);
}

.step-info-tag-add-pill:hover {
  color: var(--color-text-secondary);
  border-color: var(--color-text-tertiary);
}

.step-info-tag-add-pill .step-info-tag-add-icon,
.step-info-tag-add-pill :deep(.anticon) {
  color: inherit;
  font-size: 12px;
}

.step-info-tag-add-popover {
  padding: 4px;
}

.step-info-style-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: var(--spacing-sm);
  width: 100%;
}

.step-info-style-card {
  margin-inline-end: 0;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-container);
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast),
    color var(--transition-fast);
}

.step-info-style-card:hover,
.step-info-style-card--selected {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, var(--color-bg-container));
}

.step-info-style-card--selected {
  color: var(--color-primary);
}

.step-info-style-card :deep(.ant-radio) {
  align-self: flex-start;
  margin-top: 2px;
}

.step-info-style-card__content {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: var(--spacing-xs);
  overflow: hidden;
  color: inherit;
  font-size: 0.875rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-info-style-card__icon {
  flex-shrink: 0;
}

.avatar-config-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

@media (max-width: 768px) {
  .avatar-config-layout {
    grid-template-columns: 1fr;
  }

  .avatar-config-layout__rail {
    position: static;
  }
}
</style>
