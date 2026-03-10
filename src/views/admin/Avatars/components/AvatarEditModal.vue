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

        <a-form-item :label="t('avatar.avatarUrl')" name="avatar_url">
          <a-input
            v-model:value="form.avatar_url"
            :placeholder="t('avatar.avatarUrl')"
            allow-clear
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
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { getAvatarDetail, updateAvatar } from '@/api/avatars'
import type { Avatar, AvatarStyle, UpdateAvatarParams } from '@/types/avatar'

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
