<template>
  <div class="step-info">
    <a-form ref="formRef" layout="vertical" :model="local" :rules="rules" class="step-info-form">
      <div class="step-info-layout">
        <aside class="step-info-layout__rail">
          <input
            ref="avatarFileRef"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            style="display: none"
            aria-hidden="true"
            @change="onAvatarFileChange"
          />
          <AvatarUploadPanel
            :image-url="avatarPreviewUrl"
            :title="t('avatar.avatar')"
            :action-text="t('common.selectFile')"
            :hint="t('avatar.wizard.avatarSizeHint') + '，' + t('avatar.wizard.avatarFormatHint')"
            :loading="avatarUploading"
            @upload="triggerAvatarFileInput"
          />
        </aside>

        <div class="step-info-layout__content">
          <section class="step-info-section">
            <SectionTitle :title="t('avatar.wizard.basicInfo')" />
            <div class="step-info-section__body">
              <a-form-item :label="t('avatar.name')" name="name">
                <a-input
                  v-model:value="local.name"
                  :placeholder="t('avatar.wizard.placeholderName')"
                  :maxlength="100"
                  show-count
                />
              </a-form-item>

              <a-form-item :label="t('avatar.bio')" name="bio">
                <a-textarea
                  v-model:value="local.bio"
                  :placeholder="t('avatar.wizard.placeholderBio')"
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

          <section class="step-info-section">
            <SectionTitle :title="t('avatar.style')" />
            <div class="step-info-section__body">
              <a-form-item :label="t('avatar.greeting')" name="greeting">
                <a-textarea
                  v-model:value="local.greeting"
                  :placeholder="t('avatar.wizard.placeholderGreeting')"
                  :rows="2"
                  :maxlength="200"
                  show-count
                />
              </a-form-item>

              <a-form-item :label="t('avatar.style')" name="style">
                <a-radio-group v-model:value="local.style" class="step-info-style-group">
                  <a-radio
                    v-for="styleOpt in styleOptions"
                    :key="styleOpt.value"
                    :value="styleOpt.value"
                    class="step-info-style-card"
                    :class="{ 'step-info-style-card--selected': local.style === styleOpt.value }"
                  >
                    <span class="step-info-style-card__content">
                      <component :is="styleOpt.icon" class="step-info-style-card__icon" />
                      <span>{{ t(styleOpt.labelKey) }}</span>
                    </span>
                  </a-radio>
                </a-radio-group>
              </a-form-item>

              <a-form-item
                v-if="local.style === 'custom'"
                :label="t('avatar.styleCustom')"
                name="style_custom"
              >
                <a-input
                  v-model:value="local.style_custom"
                  :placeholder="t('avatar.styleCustom')"
                  :maxlength="100"
                  show-count
                />
              </a-form-item>
            </div>
          </section>
        </div>
      </div>
    </a-form>
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
import type { FormInstance } from 'ant-design-vue'
import AvatarUploadPanel from '@/components/AvatarUploadPanel/index.vue'
import SectionTitle from '@/components/SectionTitle/index.vue'
import type { AvatarWizardForm, AvatarStyle } from '@/types/avatar'
import { uploadAvatar } from '@/api/upload'
import type { Component } from 'vue'

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

/** 从父同步到 local 时跳过回传 emit，避免 v-model 与 deep watch 形成递归更新 */
const syncingFromParent = ref(false)

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
    syncingFromParent.value = true
    try {
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
    } finally {
      nextTick(() => {
        syncingFromParent.value = false
      })
    }
  },
  { deep: true }
)

watch(
  local,
  (val) => {
    if (syncingFromParent.value) return
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

const styleOptions = [
  { value: 'formal', labelKey: 'avatar.wizard.styleFormal', icon: UserOutlined },
  { value: 'friendly', labelKey: 'avatar.wizard.styleFriendly', icon: MessageOutlined },
  { value: 'concise', labelKey: 'avatar.wizard.styleConcise', icon: ThunderboltOutlined },
  { value: 'detailed', labelKey: 'avatar.wizard.styleDetailed', icon: FileTextOutlined },
  { value: 'custom', labelKey: 'avatar.wizard.styleCustom', icon: SettingOutlined },
] satisfies { value: AvatarStyle; labelKey: string; icon: Component }[]

defineExpose({
  validate: () => formRef.value?.validate(),
})
</script>

<style scoped lang="scss">
.step-info-layout {
  display: grid;
  grid-template-columns: minmax(220px, 260px) minmax(0, 1fr);
  gap: var(--spacing-lg);
  align-items: start;
}

.step-info-layout__rail {
  position: sticky;
  top: 0;
}

.step-info-layout__rail :deep(.avatar-upload-panel) {
  align-items: flex-start;
}

.step-info-layout__rail :deep(.avatar-upload-panel__hint) {
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
}

.step-info-layout__content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.step-info-section {
  min-width: 0;
}

.step-info-section :deep(.section-title) {
  margin-bottom: var(--spacing-md);
}

.step-info-section__body {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-container);
}

.step-info-section__body :deep(.ant-form-item:last-child) {
  margin-bottom: 0;
}

.step-info :deep(.ant-form-item-control-input-content) {
  display: block;
}
.step-info :deep(.ant-form-item-explain) {
  position: relative;
  width: 100%;
}
/* 输入框 focus 环 */
.step-info :deep(.ant-input:focus),
.step-info :deep(.ant-input:focus-visible),
.step-info :deep(.ant-input-affix-wrapper-focused) {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent);
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
  border: 1px solid color-mix(in srgb, var(--color-primary) 40%, transparent);
  border-radius: var(--radius-full);
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  font-size: 12px;
}

.step-info-tag-text {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.step-info-tag-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: var(--radius-full);
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
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-full);
  background: transparent;
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

@media (max-width: 768px) {
  .step-info-layout {
    grid-template-columns: 1fr;
  }

  .step-info-layout__rail {
    position: static;
  }
}
</style>
