<template>
  <div class="avatar-config">
    <a-spin :spinning="loading">
      <a-form
        ref="formRef"
        :model="formData"
        layout="horizontal"
        class="space-y-8"
        :label-col="{ span: 3 }"
      >
        <div class="config-section">
          <SectionTitle :title="t('avatar.wizard.config.basicInfo')" />

          <div class="section-content avatar-config-basic">
            <a-form-item
              :label="t('avatar.avatar')"
              name="avatar_url"
              class="avatar-config-basic__avatar-item"
            >
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
                :hint="
                  t('avatar.wizard.avatarSizeHint') + '，' + t('avatar.wizard.avatarFormatHint')
                "
                :loading="avatarUploading"
                variant="wizard"
                :avatar-size="80"
                :show-title="false"
                @upload="triggerAvatarFileInput"
              />
            </a-form-item>

            <div class="avatar-config-basic__fields space-y-6">
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
                  class="step-info-input"
                />
              </a-form-item>

              <a-form-item :label="t('avatar.bio')" name="bio">
                <a-textarea
                  v-model:value="formData.bio"
                  :placeholder="t('avatar.wizard.config.placeholderBio')"
                  :rows="4"
                  :maxlength="500"
                  show-count
                />
              </a-form-item>
            </div>
          </div>
        </div>

        <div class="config-section">
          <SectionTitle :title="t('avatar.wizard.config.dialogStrategy')" />

          <div class="section-content space-y-6">
            <a-form-item :label="t('avatar.greeting')" name="greeting">
              <a-input
                v-model:value="formData.greeting"
                :placeholder="t('avatar.wizard.config.placeholderGreeting')"
                :maxlength="200"
                show-count
                class="step-info-input"
              />
            </a-form-item>

            <a-form-item :label="t('avatar.style')" name="style">
              <AvatarStyleSelector v-model="formData.style" />

              <div v-if="formData.style === 'custom'" class="mt-3">
                <a-input
                  :value="formData.style_custom ?? ''"
                  :placeholder="t('avatar.styleCustom')"
                  :maxlength="100"
                  class="step-info-input"
                  @update:value="onStyleCustomUpdate"
                />
              </div>
            </a-form-item>

            <a-form-item :label="t('avatar.tags')" name="tags">
              <div class="step-info-tags-wrap">
                <span
                  v-for="(tag, index) in formData.tags"
                  :key="`${tag}-${index}`"
                  class="step-info-tag-pill"
                >
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

                <a-popover v-model:open="tagPopoverVisible" trigger="click" placement="bottomLeft">
                  <template #content>
                    <div class="p-2 flex gap-2">
                      <a-input
                        v-model:value="newTag"
                        :placeholder="t('avatar.wizard.tagPlaceholder')"
                        :maxlength="20"
                        size="small"
                        class="w-32"
                        @press-enter="addTag"
                      />
                      <a-button type="primary" size="small" @click="addTag">
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
        </div>

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

        <div class="flex justify-end gap-3 pt-4">
          <a-button @click="emit('cancel')">{{ t('common.cancel') }}</a-button>
          <a-button type="primary" :loading="saving" @click="handleSave">
            {{ t('common.save') }}
          </a-button>
        </div>
      </a-form>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CloseOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import AdvancedConfigFields from './AdvancedConfigFields.vue'
import AvatarUploadPanel from '@/components/AvatarUploadPanel/index.vue'
import SectionTitle from '@/components/SectionTitle/index.vue'
import AvatarStyleSelector from '@/views/admin/Avatars/components/AvatarStyleSelector.vue'
import type { OwnerType } from '@/constants/avatar'
import type { UpdateAvatarConfigParams } from '@/types/avatarConfig'
import type { AvatarStyle, UpdateAvatarParams } from '@/types/avatar'
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
  style: AvatarStyle
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
@reference "../../styles/index.css";

.config-section {
  @apply bg-white dark:bg-gray-800 rounded-lg;
}

.config-section :deep(.section-title) {
  margin-bottom: var(--spacing-md);
}

.avatar-config-basic {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 32px;
  align-items: start;
}

.avatar-config-basic__avatar-item {
  margin-bottom: 0;
}

.avatar-config-basic__avatar-item :deep(.ant-form-item-row) {
  display: block;
}

.avatar-config-basic__avatar-item :deep(.ant-form-item-label) {
  display: block;
  max-width: none;
  padding-bottom: 12px;
  text-align: left;
}

.avatar-config-basic__avatar-item :deep(.ant-form-item-control) {
  display: block;
  max-width: none;
}

.avatar-config-basic__avatar-item :deep(.ant-form-item-control-input-content) {
  display: flex;
  width: 184px;
  margin-left: 56px;
  justify-content: center;
}

.avatar-config :deep(.avatar-upload-panel) {
  width: 184px;
  max-width: 184px;
  padding: 0;
  border: 0;
  background: transparent;
}

.avatar-config :deep(.avatar-upload-panel--wizard .avatar-upload-panel__body) {
  align-items: center;
  text-align: center;
}

.avatar-config :deep(.avatar-upload-panel--wizard .avatar-upload-panel__preview) {
  align-self: center;
}

.step-info-input {
  @apply w-full px-4 py-2 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm;
}

.step-info-input:focus {
  @apply outline-none border-[#0ea5e9] ring-2 ring-[#0ea5e9]/20;
}

.step-info-tags-wrap {
  @apply flex flex-wrap items-center gap-2 min-h-[32px];
}

.step-info-tag-pill {
  @apply inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0ea5e9]/10 border border-[#0ea5e9]/40 text-[#0ea5e9] text-xs;
  max-width: 180px;
}

.step-info-tag-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-info-tag-remove {
  @apply inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-[#0ea5e9]/20 cursor-pointer shrink-0;
}

.step-info-tag-remove:focus-visible,
.step-info-tag-add-pill:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.step-info-tag-remove-icon {
  @apply text-[10px];
}

.step-info-tag-add-pill {
  @apply inline-flex items-center gap-1 px-3 py-1 rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 text-xs cursor-pointer hover:border-gray-400 hover:text-gray-500 transition-colors;
}

.step-info-tag-add-icon {
  @apply text-xs;
}

:deep(.ant-form-item-label > label) {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

:deep(.ant-form-item-required::before) {
  @apply text-red-500 mr-1;
}

@media (max-width: 768px) {
  .avatar-config-basic {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }

  :deep(.ant-form-item) {
    display: block;
  }
}
</style>
