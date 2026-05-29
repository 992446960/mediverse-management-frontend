<template>
  <a-modal
    :open="open"
    :title="t('avatar.editAvatar')"
    width="920px"
    :confirm-loading="submitLoading"
    :ok-text="t('common.confirm')"
    :cancel-text="t('common.cancel')"
    :destroy-on-close="true"
    @ok="onSubmit"
    @cancel="emit('update:open', false)"
  >
    <a-skeleton v-if="loading" active />

    <template v-else>
      <a-form ref="formRef" layout="vertical" :model="form" :rules="rules">
        <div class="edit-avatar-layout">
          <aside class="edit-avatar-layout__rail">
            <input
              ref="avatarFileRef"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style="display: none"
              aria-hidden="true"
              @change="onAvatarFileChange"
            />
            <AvatarUploadPanel
              :image-url="form.avatar_url"
              :title="t('avatar.avatar')"
              :action-text="t('common.selectFile')"
              :hint="t('avatar.wizard.avatarSizeHint') + '，' + t('avatar.wizard.avatarFormatHint')"
              :loading="avatarUploading"
              @upload="triggerAvatarFileInput"
            />
            <div v-if="avatar" class="edit-avatar-layout__scope">
              {{ t('avatar.scopeDisplay', { scope: formatScope(avatar) }) }}
            </div>
          </aside>

          <div class="edit-avatar-layout__content">
            <section class="edit-avatar-section">
              <SectionTitle :title="t('avatar.wizard.basicInfo')" />
              <div class="edit-avatar-section__body">
                <a-form-item :label="t('avatar.name')" name="name">
                  <a-input
                    v-model:value="form.name"
                    :placeholder="t('avatar.name')"
                    :maxlength="100"
                    show-count
                  />
                </a-form-item>

                <a-form-item :label="t('avatar.bio')" name="bio">
                  <a-textarea
                    v-model:value="form.bio"
                    :placeholder="t('avatar.bio')"
                    :rows="3"
                    :maxlength="500"
                    show-count
                  />
                </a-form-item>

                <a-form-item name="tags">
                  <template #label>
                    <span class="step-info-label">{{ t('avatar.tags') }}</span>
                  </template>
                  <div class="step-info-tags-wrap flex flex-wrap items-center gap-2">
                    <template v-for="(tag, index) in form.tags" :key="`${tag}-${index}`">
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
                      v-if="form.tags.length < TAG_MAX_COUNT"
                      v-model:open="tagPopoverOpen"
                      trigger="click"
                      overlay-class-name="step-info-tag-popover"
                      @open-change="onTagPopoverOpenChange"
                    >
                      <template #content>
                        <div class="step-info-tag-add-popover p-1">
                          <a-input
                            ref="tagInputRef"
                            v-model:value="tagInputValue"
                            :placeholder="t('avatar.wizard.tagPlaceholder')"
                            :maxlength="20"
                            size="small"
                            class="w-48"
                            @keydown.enter.prevent="confirmAddTag"
                          />
                          <a-button
                            type="primary"
                            size="small"
                            class="mt-2 w-full"
                            @click="confirmAddTag"
                          >
                            {{ t('common.confirm') }}
                          </a-button>
                        </div>
                      </template>
                      <span
                        class="step-info-tag-add-pill"
                        role="button"
                        tabindex="0"
                        :aria-label="t('avatar.wizard.addTag')"
                        @keydown.enter.prevent="tagPopoverOpen = true"
                        @keydown.space.prevent="tagPopoverOpen = true"
                      >
                        <PlusOutlined class="step-info-tag-add-icon" />
                        <span>{{ t('avatar.wizard.tagPlaceholderAdd') }}</span>
                      </span>
                    </a-popover>
                  </div>
                </a-form-item>
              </div>
            </section>

            <section class="edit-avatar-section">
              <SectionTitle :title="t('avatar.style')" />
              <div class="edit-avatar-section__body">
                <a-form-item :label="t('avatar.greeting')" name="greeting">
                  <a-textarea
                    v-model:value="form.greeting"
                    :placeholder="t('avatar.greeting')"
                    :rows="2"
                    :maxlength="200"
                    show-count
                  />
                </a-form-item>

                <a-form-item :label="t('avatar.style')" name="style">
                  <a-radio-group v-model:value="form.style" class="edit-style-group">
                    <a-radio
                      v-for="styleOpt in styleOptions"
                      :key="styleOpt.value"
                      :value="styleOpt.value"
                      class="edit-style-card"
                      :class="{ 'edit-style-card--selected': form.style === styleOpt.value }"
                    >
                      <span class="edit-style-card__content">
                        <component :is="styleOpt.icon" class="edit-style-card__icon" />
                        <span>{{ t(styleOpt.labelKey) }}</span>
                      </span>
                    </a-radio>
                  </a-radio-group>
                </a-form-item>

                <a-form-item
                  v-if="form.style === 'custom'"
                  :label="t('avatar.styleCustom')"
                  name="style_custom"
                >
                  <a-input
                    v-model:value="form.style_custom"
                    :placeholder="t('avatar.styleCustom')"
                    :maxlength="100"
                    show-count
                    allow-clear
                  />
                </a-form-item>
              </div>
            </section>

            <section class="edit-avatar-section">
              <SectionTitle :title="t('avatar.advanced.title')" />
              <AdvancedConfigFields
                :selected-tools="form.tools"
                :selected-skills="form.skills"
                :selected-algorithm="form.algorithm"
                :selected-model="form.model"
                :tools="toolGroups"
                :skills="skillOptions"
                :engines="engineOptions"
                :model-groups="modelGroups"
                :loading="advancedLoading"
                @update:selected-tools="form.tools = $event"
                @update:selected-skills="form.skills = $event"
                @update:selected-algorithm="form.algorithm = $event"
                @update:selected-model="form.model = $event"
              />
            </section>
          </div>
        </div>
      </a-form>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import {
  CloseOutlined,
  FileTextOutlined,
  MessageOutlined,
  PlusOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import AdvancedConfigFields from '@/components/AvatarConfig/AdvancedConfigFields.vue'
import AvatarUploadPanel from '@/components/AvatarUploadPanel/index.vue'
import SectionTitle from '@/components/SectionTitle/index.vue'
import { getEngines, getModels, getTools } from '@/api/advancedConfig'
import { getAvatarDetail, updateAvatar } from '@/api/avatars'
import { getSkills } from '@/api/skills'
import { uploadAvatar } from '@/api/upload'
import type {
  AvatarModelConfig,
  EngineItem,
  ModelGroup,
  SkillItem,
  ToolGroup,
} from '@/types/advancedConfig'
import type { Avatar, AvatarStyle, UpdateAvatarParams } from '@/types/avatar'
import {
  getDefaultEngineName,
  getEnabledNames,
  normalizeSkillOptions,
  resolveModelSelection,
} from '@/utils/avatarAdvancedConfig'
import type { Component } from 'vue'

const AVATAR_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp'

const { t } = useI18n()

interface Props {
  open: boolean
  avatarId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  success: []
}>()

const loading = ref(false)
const submitLoading = ref(false)
const avatar = ref<Avatar | null>(null)
const formRef = ref<FormInstance>()
const avatarFileRef = ref<HTMLInputElement | null>(null)
const avatarUploading = ref(false)
const advancedLoading = ref(false)
const advancedLoaded = ref(false)
const toolGroups = ref<ToolGroup[]>([])
const skillOptions = ref<SkillItem[]>([])
const engineOptions = ref<EngineItem[]>([])
const modelGroups = ref<ModelGroup[]>([])
const tagPopoverOpen = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref<{ focus: () => void } | null>(null)
const TAG_MAX_COUNT = 10
const styleOptions = [
  { value: 'formal', labelKey: 'avatar.wizard.styleFormal', icon: UserOutlined },
  { value: 'friendly', labelKey: 'avatar.wizard.styleFriendly', icon: MessageOutlined },
  { value: 'concise', labelKey: 'avatar.wizard.styleConcise', icon: ThunderboltOutlined },
  { value: 'detailed', labelKey: 'avatar.wizard.styleDetailed', icon: FileTextOutlined },
  { value: 'custom', labelKey: 'avatar.wizard.styleCustom', icon: SettingOutlined },
] satisfies { value: AvatarStyle; labelKey: string; icon: Component }[]

interface EditFormState {
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

const form = ref<EditFormState>({
  name: '',
  avatar_url: '',
  bio: '',
  tags: [],
  greeting: '',
  style: 'formal',
  style_custom: '',
  tools: [],
  skills: [],
  algorithm: null,
  model: null,
})

function formatScope(record: Avatar): string {
  const parts: string[] = [record.org_name]
  if (record.dept_name) parts.push(record.dept_name)
  if (record.user_name) parts.push(record.user_name)
  return parts.join(' / ')
}

function removeTag(index: number) {
  form.value.tags = form.value.tags.filter((_, i) => i !== index)
}

function confirmAddTag() {
  const raw = tagInputValue.value?.trim()
  if (!raw) return
  if (form.value.tags.length >= TAG_MAX_COUNT) return
  if (form.value.tags.includes(raw)) {
    tagInputValue.value = ''
    return
  }
  form.value = { ...form.value, tags: [...form.value.tags, raw] }
  tagInputValue.value = ''
  tagPopoverOpen.value = false
}

function onTagPopoverOpenChange(open: boolean) {
  if (!open) tagInputValue.value = ''
  else setTimeout(() => tagInputRef.value?.focus(), 80)
}

function triggerAvatarFileInput() {
  avatarFileRef.value?.click()
}

async function onAvatarFileChange(e: Event) {
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
    form.value = { ...form.value, avatar_url: res.url }
  } finally {
    avatarUploading.value = false
  }
}

function fillFromAvatar(a: Avatar) {
  avatar.value = a
  form.value = {
    name: a.name ?? '',
    avatar_url: a.avatar_url ?? '',
    bio: a.bio ?? '',
    tags: a.tags ?? [],
    greeting: a.greeting ?? '',
    style: a.style ?? 'formal',
    style_custom: a.style_custom ?? '',
    tools: getEnabledNames(a.tools),
    skills: getEnabledNames(a.skills),
    algorithm: a.algorithm ?? getEnabledNames(a.algorithms)[0] ?? null,
    model: a.model ?? null,
  }
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
  } finally {
    advancedLoading.value = false
  }
}

function applyAdvancedDefaults() {
  form.value = {
    ...form.value,
    algorithm: getDefaultEngineName(form.value.algorithm, engineOptions.value),
    model: resolveModelSelection(form.value.model, modelGroups.value),
  }
}

async function loadDetail(id: string) {
  loading.value = true
  try {
    const res = await getAvatarDetail(id)
    fillFromAvatar(res)
  } finally {
    loading.value = false
  }
}

async function loadOpenData() {
  await Promise.all([
    props.avatarId ? loadDetail(props.avatarId) : Promise.resolve(),
    loadAdvancedOptions(),
  ])
  applyAdvancedDefaults()
}

watch(
  () => props.open,
  (val) => {
    if (!val) return
    avatar.value = null
    formRef.value?.clearValidate?.()
    loadOpenData()
  }
)

const rules = computed(() => ({
  name: [
    { required: true, message: t('avatar.name') + ' ' + t('common.required'), trigger: 'blur' },
    { max: 100, message: t('common.max100'), trigger: 'blur' },
  ],
  style_custom: [
    {
      validator: async (_rule: unknown, value: string) => {
        if (form.value.style !== 'custom') return Promise.resolve()
        const v = String(value ?? '').trim()
        if (!v) {
          return Promise.reject(t('avatar.styleCustom') + ' ' + t('common.required'))
        }
        if (v.length > 100) {
          return Promise.reject(t('common.max100'))
        }
        return Promise.resolve()
      },
      trigger: 'blur',
    },
  ],
}))

function toUpdatePayload(v: EditFormState): UpdateAvatarParams {
  const name = v.name.trim()
  return {
    name,
    avatar_url: v.avatar_url.trim() ? v.avatar_url.trim() : null,
    bio: v.bio.trim() ? v.bio.trim() : null,
    tags: v.tags ?? [],
    greeting: v.greeting.trim() ? v.greeting.trim() : null,
    style: v.style,
    style_custom:
      v.style === 'custom' ? (v.style_custom.trim() ? v.style_custom.trim() : null) : null,
    tools: v.tools,
    skills: v.skills,
    algorithm: v.algorithm,
    model: v.model,
  }
}

async function onSubmit() {
  if (!props.avatarId) return

  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  submitLoading.value = true
  try {
    await updateAvatar(props.avatarId, toUpdatePayload(form.value))
    message.success(t('common.success'))
    emit('update:open', false)
    emit('success')
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.edit-avatar-layout {
  display: grid;
  grid-template-columns: minmax(220px, 260px) minmax(0, 1fr);
  gap: var(--spacing-lg);
  align-items: start;
}

.edit-avatar-layout__rail {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.edit-avatar-layout__rail :deep(.avatar-upload-panel__hint) {
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
}

.edit-avatar-layout__scope {
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  line-height: 1.5;
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--radius-base);
  background: var(--color-bg-layout);
}

.edit-avatar-layout__content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.edit-avatar-section {
  min-width: 0;
}

.edit-avatar-section :deep(.section-title) {
  margin-bottom: var(--spacing-md);
}

.edit-avatar-section__body {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-container);
}

.edit-avatar-section__body :deep(.ant-form-item:last-child) {
  margin-bottom: 0;
}

.step-info-label {
  display: inline-block;
}
.step-info-tags-wrap {
  min-height: 32px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.step-info-tag-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px 4px 12px;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 40%, transparent);
  color: var(--color-primary);
  font-size: 12px;
}
.step-info-tag-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  color: var(--color-primary);
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s;
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
  border-radius: 9999px;
  background: transparent;
  border: 1px dashed var(--color-border);
  color: var(--color-text-tertiary);
  font-size: 12px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s;
}
.step-info-tag-add-pill:hover {
  border-color: var(--color-text-tertiary);
  color: var(--color-text-secondary);
}
.step-info-tag-add-pill .step-info-tag-add-icon,
.step-info-tag-add-pill :deep(.anticon) {
  color: inherit;
  font-size: 12px;
}
.edit-style-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: var(--spacing-sm);
  width: 100%;
}

.edit-style-card {
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

.edit-style-card:hover,
.edit-style-card--selected {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, var(--color-bg-container));
}

.edit-style-card--selected {
  color: var(--color-primary);
}

.edit-style-card :deep(.ant-radio) {
  align-self: flex-start;
  margin-top: 2px;
}

.edit-style-card__content {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: var(--spacing-xs);
  color: inherit;
}

.edit-style-card__icon {
  flex-shrink: 0;
}

.edit-avatar-section :deep(.config-section) {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-container);
}

.edit-avatar-section :deep(.config-section .section-header) {
  display: none;
}

@media (max-width: 768px) {
  .edit-avatar-layout {
    grid-template-columns: 1fr;
  }

  .edit-avatar-layout__rail {
    position: static;
  }
}
</style>
