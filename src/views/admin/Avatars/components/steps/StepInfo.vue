<template>
  <div class="step-info w-full space-y-6">
    <a-form ref="formRef" layout="vertical" :model="local" :rules="rules" class="step-info-form">
      <a-form-item name="name">
        <template #label>
          <span class="step-info-label">{{ t('avatar.name') }}</span>
        </template>
        <div class="relative">
          <a-input
            v-model:value="local.name"
            :placeholder="t('avatar.wizard.placeholderName')"
            :maxlength="100"
            class="step-info-input w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
          />
          <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {{ local.name?.length ?? 0 }} / 100
          </span>
        </div>
      </a-form-item>

      <a-form-item name="avatar_url">
        <template #label>
          <span class="step-info-label">{{ t('avatar.avatar') }}</span>
        </template>
        <div class="step-info-avatar-wrap flex flex-col gap-2">
          <input
            ref="avatarFileRef"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            style="display: none"
            aria-hidden="true"
            @change="onAvatarFileChange"
          />
          <div
            class="step-info-upload-card group relative w-20 h-20 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col items-center justify-center cursor-pointer border border-dashed border-gray-300 dark:border-gray-600 hover:border-[#0ea5e9] hover:text-[#0ea5e9] transition-all overflow-hidden shrink-0"
            :class="{ 'pointer-events-none opacity-70': avatarUploading }"
            @click="onAvatarClick"
          >
            <a-spin v-if="avatarUploading" />
            <template v-else-if="avatarPreviewUrl">
              <img
                :src="avatarPreviewUrl"
                :alt="t('avatar.avatar')"
                class="w-full h-full object-cover"
              />
              <!-- 悬浮层：仅在有图片时显示 -->
              <div
                class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white"
              >
                <EyeOutlined
                  class="text-lg hover:scale-110 transition-transform"
                  @click.stop="handlePreview"
                />
                <UploadOutlined
                  class="text-lg hover:scale-110 transition-transform"
                  @click.stop="triggerAvatarFileInput"
                />
              </div>
            </template>
            <template v-else>
              <PlusOutlined class="text-gray-400 text-lg" />
              <span class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{
                t('avatar.wizard.avatarUpload')
              }}</span>
            </template>
          </div>
          <div class="flex flex-col gap-0.5">
            <p class="text-xs text-gray-400">
              {{ t('avatar.wizard.avatarSizeHint') + '，' + t('avatar.wizard.avatarFormatHint') }}
            </p>
          </div>
        </div>
      </a-form-item>

      <a-form-item name="bio">
        <template #label>
          <span class="step-info-label">{{ t('avatar.bio') }}</span>
        </template>
        <div class="relative">
          <a-textarea
            v-model:value="local.bio"
            :placeholder="t('avatar.wizard.placeholderBio')"
            :rows="3"
            :maxlength="500"
            class="step-info-input w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm resize-none"
          />
          <span class="absolute right-3 bottom-2 text-xs text-gray-400">
            {{ local.bio?.length ?? 0 }} / 500
          </span>
        </div>
      </a-form-item>

      <a-form-item name="tags">
        <template #label>
          <span class="step-info-label">{{ t('avatar.tags') }}</span>
        </template>
        <div class="step-info-tags-wrap flex flex-wrap items-center gap-2">
          <template v-for="(tag, index) in local.tags" :key="`${tag}-${index}`">
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
            v-if="local.tags.length < TAG_MAX_COUNT"
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
                <a-button type="primary" size="small" class="mt-2 w-full" @click="confirmAddTag">
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

      <a-form-item name="greeting">
        <template #label>
          <span class="step-info-label">{{ t('avatar.greeting') }}</span>
        </template>
        <div class="relative">
          <a-textarea
            v-model:value="local.greeting"
            :placeholder="t('avatar.wizard.placeholderGreeting')"
            :rows="2"
            :maxlength="200"
            class="step-info-input w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm resize-none"
          />
          <span class="absolute right-3 bottom-2 text-xs text-gray-400">
            {{ local.greeting?.length ?? 0 }} / 200
          </span>
        </div>
      </a-form-item>

      <a-form-item name="style">
        <template #label>
          <span class="step-info-label">{{ t('avatar.style') }}</span>
        </template>
        <div class="step-info-style-group" role="radiogroup" :aria-label="t('avatar.style')">
          <div
            v-for="styleOpt in styleOptions"
            :key="styleOpt.value"
            role="radio"
            tabindex="0"
            class="step-info-style-card cursor-pointer"
            :class="{ 'step-info-style-card--selected': local.style === styleOpt.value }"
            :aria-checked="local.style === styleOpt.value"
            @click="local.style = styleOpt.value"
            @keydown.enter.prevent="local.style = styleOpt.value"
            @keydown.space.prevent="local.style = styleOpt.value"
          >
            <span class="step-info-style-text">
              {{ t(styleOpt.labelKey) }}
            </span>
          </div>
        </div>
      </a-form-item>

      <a-form-item v-if="local.style === 'custom'" name="style_custom">
        <template #label>
          <span class="step-info-label">{{ t('avatar.styleCustom') }}</span>
        </template>
        <a-input
          v-model:value="local.style_custom"
          :placeholder="t('avatar.styleCustom')"
          :maxlength="100"
          show-count
          class="step-info-input w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
        />
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { EyeOutlined, PlusOutlined, CloseOutlined, UploadOutlined } from '@ant-design/icons-vue'
import type { FormInstance } from 'ant-design-vue'
import type { AvatarWizardForm, AvatarStyle } from '@/types/avatar'
import { uploadAvatar } from '@/api/upload'

const { t } = useI18n()

interface Props {
  modelValue: AvatarWizardForm
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: AvatarWizardForm]
}>()

const formRef = ref<FormInstance>()
const tagPopoverOpen = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref<{ focus: () => void } | null>(null)
const TAG_MAX_COUNT = 10
const avatarFileRef = ref<HTMLInputElement | null>(null)
const avatarPreviewUrl = ref('')
const AVATAR_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp'
const avatarUploading = ref(false)
const previewVisible = ref(false)

const local = ref<
  Pick<
    AvatarWizardForm,
    'name' | 'avatar_url' | 'bio' | 'tags' | 'greeting' | 'style' | 'style_custom'
  >
>({
  name: props.modelValue.name,
  avatar_url: props.modelValue.avatar_url ?? '',
  bio: props.modelValue.bio ?? '',
  tags: props.modelValue.tags ?? [],
  greeting: props.modelValue.greeting ?? '',
  style: props.modelValue.style,
  style_custom: props.modelValue.style_custom ?? '',
})

watch(
  () => props.modelValue,
  (val) => {
    local.value = {
      name: val.name,
      avatar_url: val.avatar_url ?? '',
      bio: val.bio ?? '',
      tags: val.tags ?? [],
      greeting: val.greeting ?? '',
      style: val.style,
      style_custom: val.style_custom ?? '',
    }
    if (!val.avatar_url) {
      revokeAvatarPreview()
    } else {
      if (
        avatarPreviewUrl.value &&
        avatarPreviewUrl.value.startsWith('blob:') &&
        avatarPreviewUrl.value !== val.avatar_url
      ) {
        URL.revokeObjectURL(avatarPreviewUrl.value)
      }
      avatarPreviewUrl.value = val.avatar_url
    }
  },
  { deep: true }
)

watch(
  local,
  (val) => {
    emit('update:modelValue', {
      ...props.modelValue,
      name: val.name,
      avatar_url: val.avatar_url || undefined,
      bio: val.bio || undefined,
      tags: val.tags,
      greeting: val.greeting || undefined,
      style: val.style as AvatarStyle,
      style_custom: val.style === 'custom' ? val.style_custom || undefined : undefined,
    })
  },
  { deep: true }
)

function removeTag(index: number) {
  const next = local.value.tags.filter((_, i) => i !== index)
  local.value = { ...local.value, tags: next }
}

function confirmAddTag() {
  const raw = tagInputValue.value?.trim()
  if (!raw) return
  if (local.value.tags.length >= TAG_MAX_COUNT) return
  if (local.value.tags.includes(raw)) {
    tagInputValue.value = ''
    return
  }
  local.value = { ...local.value, tags: [...local.value.tags, raw] }
  tagInputValue.value = ''
  tagPopoverOpen.value = false
}

function onTagPopoverOpenChange(open: boolean) {
  tagPopoverOpen.value = open
  if (!open) tagInputValue.value = ''
  else setTimeout(() => tagInputRef.value?.focus(), 80)
}

function revokeAvatarPreview() {
  if (avatarPreviewUrl.value && avatarPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(avatarPreviewUrl.value)
  }
  avatarPreviewUrl.value = ''
}

function triggerAvatarFileInput() {
  avatarFileRef.value?.click()
}

function handlePreview() {
  previewVisible.value = true
}

function onAvatarClick() {
  if (avatarPreviewUrl.value) {
    handlePreview()
  } else {
    triggerAvatarFileInput()
  }
}

async function onAvatarFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const type = file.type as string
  if (
    !AVATAR_ACCEPT.split(',')
      .map((s) => s.trim())
      .includes(type)
  ) {
    return
  }
  revokeAvatarPreview()
  avatarUploading.value = true
  try {
    const res = await uploadAvatar(file)
    const nextUrl = res.url
    avatarPreviewUrl.value = nextUrl
    local.value = { ...local.value, avatar_url: nextUrl }
  } catch {
    revokeAvatarPreview()
  } finally {
    avatarUploading.value = false
  }
}

onBeforeUnmount(revokeAvatarPreview)

const rules = computed(() => ({
  name: [
    { required: true, message: t('avatar.name') + ' ' + t('common.required'), trigger: 'blur' },
    { max: 100, message: t('common.max100'), trigger: 'blur' },
  ],
}))

const styleOptions: { value: AvatarStyle; labelKey: string }[] = [
  { value: 'formal', labelKey: 'avatar.wizard.styleFormal' },
  { value: 'friendly', labelKey: 'avatar.wizard.styleFriendly' },
  { value: 'concise', labelKey: 'avatar.wizard.styleConcise' },
  { value: 'detailed', labelKey: 'avatar.wizard.styleDetailed' },
  { value: 'custom', labelKey: 'avatar.wizard.styleCustom' },
]

defineExpose({
  validate: () => formRef.value?.validate(),
})
</script>

<style scoped>
.step-info-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--ant-color-text, #374151);
}
/* 表单项间距 12px，错误提示紧贴对应表单项下方 */
.step-info :deep(.ant-form-item) {
  margin-bottom: 12px;
}
.step-info :deep(.ant-form-item-control-input-content) {
  display: block;
}
.step-info :deep(.ant-form-item-explain) {
  position: relative;
  width: 100%;
}
/* 输入框 focus 环 */
.step-info-input:focus,
.step-info-input:focus-visible,
.step-info :deep(.ant-input:focus),
.step-info :deep(.ant-input:focus-visible),
.step-info :deep(.ant-input-affix-wrapper-focused) {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2);
}

/* 标签：原型样式 - 已选浅蓝底+蓝边框+蓝字+蓝色 ×，「添加标签」白底+灰虚线边框+灰字+灰 + */
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
  background: rgba(14, 165, 233, 0.12);
  border: 1px solid rgba(14, 165, 233, 0.4);
  color: #0ea5e9;
  font-size: 12px;
}
.step-info-tag-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  color: #0ea5e9;
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s;
}
.step-info-tag-remove:hover {
  color: #0284c7;
  background: rgba(14, 165, 233, 0.15);
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
  border: 1px dashed #d1d5db;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s;
}
.step-info-tag-add-pill:hover {
  border-color: #9ca3af;
  color: #6b7280;
}
.step-info-tag-add-pill .step-info-tag-add-icon,
.step-info-tag-add-pill :deep(.anticon) {
  color: inherit;
  font-size: 12px;
}
.dark .step-info-tag-add-pill {
  border-color: #4b5563;
  color: #9ca3af;
}
.dark .step-info-tag-add-pill:hover {
  border-color: #6b7280;
  color: #d1d5db;
}

/* 沟通风格：横向单选卡片，选中蓝框+浅蓝底+蓝字+实心圆，未选灰框+白底+灰字 */
.step-info-style-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  width: 100%;
}
.step-info-style-card {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  transition:
    border-color 0.15s,
    background 0.15s;
}
.step-info-style-card:hover {
  border-color: #0ea5e9;
}
.step-info-style-card--selected {
  border-color: #0ea5e9 !important;
  background: rgba(14, 165, 233, 0.06);
}
.step-info-style-card--selected .step-info-style-text {
  color: #0ea5e9;
}
.step-info-style-text {
  font-size: 14px;
  color: #6b7280;
}
.dark .step-info-style-card {
  background: var(--ant-color-bg-container);
  border-color: #4b5563;
}
.dark .step-info-style-card--selected {
  border-color: #0ea5e9 !important;
  background: rgba(14, 165, 233, 0.12);
}
</style>
