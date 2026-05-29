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
            variant="wizard"
            :avatar-size="112"
            clearable
            :clear-text="t('avatar.wizard.removeAvatar')"
            @upload="triggerAvatarFileInput"
            @clear="clearAvatar"
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
                <TagListEditor v-model:tags="local.tags" />
              </a-form-item>
            </div>
          </section>
        </div>

        <section class="step-info-section step-info-section--style">
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
              <AvatarStyleSelector v-model="local.style" />
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
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { FormInstance } from 'ant-design-vue'
import AvatarUploadPanel from '@/components/AvatarUploadPanel/index.vue'
import SectionTitle from '@/components/SectionTitle/index.vue'
import TagListEditor from '@/components/TagListEditor/index.vue'
import AvatarStyleSelector from '../AvatarStyleSelector.vue'
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

function revokeAvatarPreview() {
  if (avatarPreviewUrl.value && avatarPreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(avatarPreviewUrl.value)
  }
  avatarPreviewUrl.value = ''
}

function triggerAvatarFileInput() {
  avatarFileRef.value?.click()
}

function clearAvatar() {
  revokeAvatarPreview()
  local.value = { ...local.value, avatar_url: '' }
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

defineExpose({
  validate: () => formRef.value?.validate(),
})
</script>

<style scoped lang="scss">
.step-info-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.step-info-layout__rail {
  position: sticky;
  top: 0;
  min-height: 420px;
  padding-right: 20px;
  border-right: 1px solid var(--color-border-secondary);
}

.step-info-layout__rail :deep(.avatar-upload-panel) {
  align-items: flex-start;
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

.step-info-section--style {
  grid-column: 1 / -1;
}

.step-info-section :deep(.section-title) {
  margin-bottom: var(--spacing-md);
}

.step-info-section__body {
  padding: 0;
  border: 0;
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

@media (max-width: 768px) {
  .step-info-layout {
    grid-template-columns: 1fr;
  }

  .step-info-layout__rail {
    position: static;
    min-height: 0;
    padding-right: 0;
    border-right: 0;
  }
}
</style>
