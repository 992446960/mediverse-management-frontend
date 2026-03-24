<template>
  <a-modal
    :open="open"
    :title="t('avatar.editAvatar')"
    width="40%"
    :confirm-loading="submitLoading"
    :ok-text="t('common.confirm')"
    :cancel-text="t('common.cancel')"
    :destroy-on-close="true"
    @ok="onSubmit"
    @cancel="emit('update:open', false)"
  >
    <a-skeleton v-if="loading" active />

    <template v-else>
      <div v-if="avatar" class="edit-avatar-alert-wrap">
        <a-alert
          type="info"
          :message="t('avatar.scopeDisplay', { scope: formatScope(avatar) })"
          show-icon
        />
      </div>

      <a-form ref="formRef" layout="vertical" :model="form" :rules="rules">
        <a-form-item :label="t('avatar.name')" name="name">
          <a-input
            v-model:value="form.name"
            :placeholder="t('avatar.name')"
            :maxlength="100"
            show-count
          />
        </a-form-item>

        <a-form-item :label="t('avatar.avatar')" name="avatar_url">
          <div class="edit-avatar-wrap flex flex-col gap-2">
            <input
              ref="avatarFileRef"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style="display: none"
              aria-hidden="true"
              @change="onAvatarFileChange"
            />
            <div
              class="edit-avatar-upload-card group relative w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-700 flex flex-col items-center justify-center border border-dashed border-gray-300 dark:border-gray-600 overflow-hidden shrink-0"
              :class="[
                form.avatar_url
                  ? ''
                  : 'cursor-pointer hover:border-[#0ea5e9] hover:text-[#0ea5e9] transition-all',
                avatarUploading ? 'pointer-events-none opacity-70' : '',
              ]"
              @click="onAvatarClick"
            >
              <a-spin v-if="avatarUploading" />
              <template v-else-if="form.avatar_url">
                <div class="absolute inset-0 w-full h-full" @click.stop>
                  <a-image
                    :src="form.avatar_url"
                    :alt="t('avatar.avatar')"
                    class="w-full h-full [&_.ant-image]:block! [&_.ant-image-img]:w-full! [&_.ant-image-img]:h-full! [&_.ant-image-img]:object-cover!"
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
            <template v-if="form.avatar_url">
              <div class="text-left">
                <a-button
                  type="link"
                  size="small"
                  class="p-0 h-auto"
                  @click="triggerAvatarFileInput"
                >
                  {{ t('common.selectFile') }}
                </a-button>
              </div>
            </template>
            <p class="text-xs text-gray-400">
              {{ t('avatar.wizard.avatarSizeHint') + '，' + t('avatar.wizard.avatarFormatHint') }}
            </p>
          </div>
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
          <a-radio-group v-model:value="form.style" class="w-full">
            <a-radio value="formal">{{ t('avatar.wizard.styleFormal') }}</a-radio>
            <a-radio value="friendly">{{ t('avatar.wizard.styleFriendly') }}</a-radio>
            <a-radio value="concise">{{ t('avatar.wizard.styleConcise') }}</a-radio>
            <a-radio value="detailed">{{ t('avatar.wizard.styleDetailed') }}</a-radio>
            <a-radio value="custom">{{ t('avatar.wizard.styleCustom') }}</a-radio>
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
      </a-form>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { PlusOutlined, CloseOutlined } from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import { getAvatarDetail, updateAvatar } from '@/api/avatars'
import { uploadAvatar } from '@/api/upload'
import type { Avatar, AvatarStyle, UpdateAvatarParams } from '@/types/avatar'

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
const tagPopoverOpen = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref<{ focus: () => void } | null>(null)
const TAG_MAX_COUNT = 10

interface EditFormState {
  name: string
  avatar_url: string
  bio: string
  tags: string[]
  greeting: string
  style: AvatarStyle
  style_custom: string
}

const form = ref<EditFormState>({
  name: '',
  avatar_url: '',
  bio: '',
  tags: [],
  greeting: '',
  style: 'formal',
  style_custom: '',
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

function onAvatarClick() {
  if (form.value.avatar_url) return
  triggerAvatarFileInput()
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

watch(
  () => props.open,
  (val) => {
    if (!val) return
    avatar.value = null
    formRef.value?.clearValidate?.()
    if (props.avatarId) loadDetail(props.avatarId)
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

<style scoped>
.edit-avatar-alert-wrap {
  margin-bottom: 1rem;
}
.edit-avatar-upload-card {
  min-width: 80px;
  min-height: 80px;
  border-radius: 50%;
}
.edit-avatar-upload-card :deep(.ant-image) {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 50%;
}
.edit-avatar-upload-card :deep(.ant-image-img) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  border-radius: 50%;
}

/* 标签：与新增分身 StepInfo 一致 - 已选浅蓝底+蓝边框+蓝字+蓝色 ×，「添加标签」灰虚线边框+灰字 */
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
</style>
