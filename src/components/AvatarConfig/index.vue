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
              <TagListEditor v-model:tags="formData.tags" />
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
import { message } from 'ant-design-vue'
import AdvancedConfigFields from './AdvancedConfigFields.vue'
import AvatarUploadPanel from '@/components/AvatarUploadPanel/index.vue'
import SectionTitle from '@/components/SectionTitle/index.vue'
import TagListEditor from '@/components/TagListEditor/index.vue'
import AvatarStyleSelector from '@/views/admin/Avatars/components/AvatarStyleSelector.vue'
import type { OwnerType } from '@/constants/avatar'
import type { UpdateAvatarConfigParams } from '@/types/avatarConfig'
import type { AvatarStyle, UpdateAvatarParams } from '@/types/avatar'
import type { AvatarModelConfig } from '@/types/advancedConfig'
import { useAdvancedConfigOptions } from '@/composables/useAdvancedConfigOptions'
import { getAvatarConfig, updateMyAvatarConfig } from '@/api/avatarConfig'
import { getAvatarDetail, updateAvatar } from '@/api/avatars'
import { uploadAvatar } from '@/api/upload'
import { extractAvatarFormValues } from '@/utils/avatar'

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
const avatarUploading = ref(false)
const {
  toolGroups,
  skillOptions,
  engineOptions,
  modelGroups,
  advancedLoading,
  loadAdvancedOptions,
  applyAdvancedDefaults,
} = useAdvancedConfigOptions()

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
  const values = extractAvatarFormValues(res)
  Object.assign(formData, {
    ...values,
    style_custom: values.style_custom || null,
  })
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
    applyAdvancedDefaults(formData)
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
  border-radius: var(--radius-base);
  background: var(--color-bg-container);
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
  width: 100%;
  padding: 0.5rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-container);
  color: var(--color-text-base);
  font-size: 0.875rem;
}

.step-info-input:focus {
  @apply outline-none border-primary ring-2 ring-primary/20;
}

:deep(.ant-form-item-label > label) {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
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
