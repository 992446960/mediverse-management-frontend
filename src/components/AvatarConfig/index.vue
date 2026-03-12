<template>
  <div class="avatar-config">
    <a-spin :spinning="loading">
      <a-form ref="formRef" :model="formData" layout="vertical" class="space-y-8">
        <!-- 分区一：基础信息配置 -->
        <div class="config-section">
          <div class="section-header">
            <span class="section-title">{{ t('avatar.wizard.config.basicInfo') }}</span>
          </div>

          <div class="section-content space-y-6">
            <!-- 头像上传 -->
            <a-form-item :label="t('avatar.avatar')" name="avatar_url">
              <div class="avatar-upload-wrap flex flex-col gap-2">
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  class="hidden"
                  aria-hidden="true"
                  @change="onAvatarFileChange"
                />
                <div
                  class="avatar-upload-card"
                  :class="{ 'pointer-events-none opacity-70': avatarUploading }"
                  @click="triggerUpload"
                >
                  <a-spin v-if="avatarUploading" />
                  <img
                    v-else-if="formData.avatar_url"
                    :src="formData.avatar_url"
                    :alt="t('avatar.avatar')"
                    class="w-full h-full object-cover"
                  />
                  <template v-else>
                    <PlusOutlined class="text-gray-400 text-lg" />
                    <span class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{
                      t('avatar.wizard.avatarUpload')
                    }}</span>
                  </template>
                </div>
                <p class="text-xs text-gray-400">
                  {{ t('avatar.wizard.avatarSizeHint') }}，{{
                    t('avatar.wizard.config.avatarFormatHint')
                  }}
                </p>
              </div>
            </a-form-item>

            <!-- 名称 -->
            <a-form-item
              :label="t('avatar.name')"
              name="name"
              :rules="[{ required: true, message: t('common.required') }]"
            >
              <a-input
                v-model:value="formData.name"
                :placeholder="t('avatar.wizard.config.placeholderName')"
                :maxlength="100"
                show-count
                class="step-info-input"
              />
            </a-form-item>

            <!-- 角色简介 -->
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

        <!-- 分区二：对话策略 -->
        <div class="config-section">
          <div class="section-header">
            <span class="section-title">{{ t('avatar.wizard.config.dialogStrategy') }}</span>
          </div>

          <div class="section-content space-y-6">
            <!-- 开场白 -->
            <a-form-item :label="t('avatar.greeting')" name="greeting">
              <a-input
                v-model:value="formData.greeting"
                :placeholder="t('avatar.wizard.config.placeholderGreeting')"
                :maxlength="200"
                show-count
                class="step-info-input"
              />
            </a-form-item>

            <!-- 沟通风格 -->
            <a-form-item :label="t('avatar.style')" name="style">
              <div class="step-info-style-group">
                <div
                  v-for="opt in styleOptions"
                  :key="opt.value"
                  class="step-info-style-card"
                  :class="{ 'step-info-style-card--selected': formData.style === opt.value }"
                  @click="formData.style = opt.value"
                >
                  <span class="step-info-style-text">{{ t(opt.labelKey) }}</span>
                </div>
              </div>

              <!-- 自定义风格输入 -->
              <div v-if="formData.style === 'custom'" class="mt-3">
                <a-input
                  v-model:value="formData.style_custom"
                  :placeholder="t('avatar.styleCustom')"
                  :maxlength="100"
                  class="step-info-input"
                />
              </div>
            </a-form-item>

            <!-- 关联知识库标签 -->
            <a-form-item :label="t('avatar.tags')" name="tags">
              <div class="step-info-tags-wrap">
                <span v-for="(tag, index) in formData.tags" :key="tag" class="step-info-tag-pill">
                  <span class="step-info-tag-text">{{ tag }}</span>
                  <span class="step-info-tag-remove" @click="removeTag(index)">
                    <CloseOutlined class="step-info-tag-remove-icon" />
                  </span>
                </span>

                <a-popover v-model:open="tagPopoverVisible" trigger="click" placement="bottomLeft">
                  <template #content>
                    <div class="p-2 flex gap-2">
                      <a-input
                        v-model:value="newTag"
                        size="small"
                        class="w-32"
                        @press-enter="addTag"
                      />
                      <a-button type="primary" size="small" @click="addTag">
                        {{ t('common.add') }}
                      </a-button>
                    </div>
                  </template>
                  <span class="step-info-tag-add-pill">
                    <PlusOutlined class="step-info-tag-add-icon" />
                    <span>{{ t('avatar.wizard.tagPlaceholderAdd') }}</span>
                  </span>
                </a-popover>
              </div>
            </a-form-item>
          </div>
        </div>

        <!-- 操作按钮 -->
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
import { ref, onMounted, watch, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { PlusOutlined, CloseOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { OwnerType } from '@/constants/avatar'
import type { UpdateAvatarConfigParams } from '@/types/avatarConfig'
import type { AvatarStyle } from '@/types/avatar'
import { getAvatarConfig, updateAvatarConfig } from '@/api/avatarConfig'
import { uploadAvatar } from '@/api/upload'

const props = defineProps<{
  ownerType: OwnerType
  ownerId?: string
  readonly?: boolean
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

const AVATAR_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp'

const formData = reactive<UpdateAvatarConfigParams & { tags: string[] }>({
  name: '',
  avatar_url: '',
  bio: '',
  greeting: '',
  style: 'formal',
  style_custom: '',
  tags: [],
})

const styleOptions: { value: AvatarStyle; labelKey: string }[] = [
  { value: 'formal', labelKey: 'avatar.wizard.styleFormal' },
  { value: 'friendly', labelKey: 'avatar.wizard.styleFriendly' },
  { value: 'concise', labelKey: 'avatar.wizard.styleConcise' },
  { value: 'detailed', labelKey: 'avatar.wizard.styleDetailed' },
  { value: 'custom', labelKey: 'avatar.wizard.styleCustom' },
]

const fetchConfig = async () => {
  if (props.ownerType !== 'personal' && !props.ownerId) return
  loading.value = true
  try {
    const res = await getAvatarConfig(props.ownerType, props.ownerId)
    Object.assign(formData, {
      name: res.name,
      avatar_url: res.avatar_url,
      bio: res.bio,
      greeting: res.greeting,
      style: res.style,
      style_custom: res.style_custom,
      tags: res.tags || [],
    })
  } catch (err) {
    console.error('Failed to fetch avatar config:', err)
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  try {
    await formRef.value.validate()
    saving.value = true
    await updateAvatarConfig(props.ownerType, props.ownerId, formData)
    message.success(t('common.success'))
    emit('saved')
  } catch (err) {
    console.error('Failed to save avatar config:', err)
  } finally {
    saving.value = false
  }
}

const triggerUpload = () => {
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

watch(() => props.ownerId, fetchConfig)
onMounted(fetchConfig)
</script>

<style scoped>
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

.avatar-upload-card {
  @apply w-20 h-20 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col items-center justify-center 
         cursor-pointer border border-dashed border-gray-300 dark:border-gray-600 
         hover:border-[#0ea5e9] hover:text-[#0ea5e9] transition-all overflow-hidden shrink-0;
  min-width: 80px;
  min-height: 80px;
}

/* 复用 StepInfo.vue 的样式类名 */
.step-info-input {
  @apply w-full px-4 py-2  dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm;
}

.step-info-input:focus {
  @apply outline-none border-[#0ea5e9] ring-2 ring-[#0ea5e9]/20;
}

.step-info-tags-wrap {
  @apply flex flex-wrap items-center gap-2 min-h-[32px];
}

.step-info-tag-pill {
  @apply inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0ea5e9]/10 border border-[#0ea5e9]/40 text-[#0ea5e9] text-xs;
}

.step-info-tag-remove {
  @apply inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-[#0ea5e9]/20 cursor-pointer;
}

.step-info-tag-remove-icon {
  @apply text-[10px];
}

.step-info-tag-add-pill {
  @apply inline-flex items-center gap-1 px-3 py-1 rounded-full border border-dashed border-gray-300 dark:border-gray-600 
         text-gray-400 text-xs cursor-pointer hover:border-gray-400 hover:text-gray-500 transition-colors;
}

.step-info-style-group {
  @apply flex flex-wrap gap-3;
}

.step-info-style-card {
  @apply inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg 
         bg-white dark:bg-gray-800 cursor-pointer transition-all hover:border-[#0ea5e9];
}

.step-info-style-card--selected {
  @apply border-[#0ea5e9] bg-[#0ea5e9]/5;
}

.step-info-style-card--selected .step-info-style-text {
  @apply text-[#0ea5e9];
}

.step-info-style-text {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

:deep(.ant-form-item-label > label) {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300;
}

:deep(.ant-form-item-required::before) {
  @apply text-red-500 mr-1;
}
</style>
