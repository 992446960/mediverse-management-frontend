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
      <a-alert
        v-if="avatar"
        class="mb-4"
        type="info"
        :message="t('avatar.scopeDisplay', { scope: formatScope(avatar) })"
        show-icon
      />

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
              class="edit-avatar-upload-card group relative w-20 h-20 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col items-center justify-center cursor-pointer border border-dashed border-gray-300 dark:border-gray-600 hover:border-[#0ea5e9] hover:text-[#0ea5e9] transition-all overflow-hidden shrink-0"
              :class="{ 'pointer-events-none opacity-70': avatarUploading }"
              @click="onAvatarClick"
            >
              <a-spin v-if="avatarUploading" />
              <template v-else-if="form.avatar_url">
                <img
                  :src="form.avatar_url"
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

        <a-form-item :label="t('avatar.tags')" name="tags">
          <a-select
            v-model:value="form.tags"
            mode="tags"
            :placeholder="t('avatar.tags')"
            :max-tag-count="10"
            class="w-full"
          />
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
import { EyeOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons-vue'
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
const previewVisible = ref(false)

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

function triggerAvatarFileInput() {
  avatarFileRef.value?.click()
}

function handlePreview() {
  previewVisible.value = true
}

function onAvatarClick() {
  if (form.value.avatar_url) {
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
  style_custom:
    form.value.style === 'custom'
      ? [
          {
            required: true,
            message: t('avatar.styleCustom') + ' ' + t('common.required'),
            trigger: 'blur',
          },
          { max: 100, message: t('common.max100'), trigger: 'blur' },
        ]
      : [],
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
.edit-avatar-upload-card {
  min-width: 80px;
  min-height: 80px;
}
</style>
