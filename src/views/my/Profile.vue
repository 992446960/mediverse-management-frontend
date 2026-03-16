<template>
  <div class="profile-page">
    <a-spin :spinning="loading">
      <template v-if="!user">
        <a-result :title="t('profile.notLoggedIn')" status="403">
          <template #extra>
            <a-button type="primary" @click="router.push('/login')">
              {{ t('common.login') }}
            </a-button>
          </template>
        </a-result>
      </template>
      <template v-else>
        <div class="page-header mb-6">
          <h1 class="text-xl font-semibold text-[var(--color-text)]">
            {{ t('profile.title') }}
          </h1>
          <p class="text-sm text-[var(--color-text-secondary)] mt-1">
            {{ t('profile.editHint') }}
          </p>
        </div>

        <div class="profile-layout grid grid-cols-1 lg:grid-cols-5 gap-6">
          <!-- 左侧：全部表单，不可修改项禁用 -->
          <a-card class="lg:col-span-3" :title="t('profile.formTitle')">
            <a-form
              ref="formRef"
              :model="formState"
              :rules="formRules"
              layout="vertical"
              @finish="handleSubmit"
            >
              <a-form-item :label="t('user.realName')" name="real_name">
                <a-input
                  v-model:value="formState.real_name"
                  :placeholder="t('user.realName')"
                  :maxlength="50"
                  show-count
                />
              </a-form-item>
              <a-form-item :label="t('avatar.avatar')" name="avatar_url">
                <div class="avatar-upload-wrap flex items-start gap-4">
                  <input
                    ref="fileInputRef"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    style="display: none"
                    aria-hidden="true"
                    @change="onAvatarFileChange"
                  />
                  <div
                    class="avatar-box w-24 h-24 rounded-lg bg-[var(--color-fill-quaternary)] border border-dashed border-[var(--color-border)] flex items-center justify-center cursor-pointer overflow-hidden shrink-0 hover:border-[var(--color-primary)] transition-colors"
                    :class="{ 'pointer-events-none opacity-70': avatarUploading }"
                    @click="triggerAvatarInput"
                  >
                    <a-spin v-if="avatarUploading" />
                    <template v-else-if="formState.avatar_url">
                      <img
                        :src="formState.avatar_url"
                        :alt="t('avatar.avatar')"
                        class="w-full h-full object-cover"
                      />
                    </template>
                    <template v-else>
                      <UserOutlined class="text-3xl text-[var(--color-text-tertiary)]" />
                    </template>
                  </div>
                  <div class="flex flex-col gap-1">
                    <a-button size="small" @click="triggerAvatarInput">
                      {{
                        formState.avatar_url ? t('common.edit') : t('avatar.wizard.avatarUpload')
                      }}
                    </a-button>
                    <span class="text-xs text-[var(--color-text-tertiary)]">
                      {{ t('avatar.wizard.avatarFormatHint') }}
                    </span>
                  </div>
                </div>
              </a-form-item>
              <a-form-item :label="t('user.username')" name="username">
                <a-input
                  v-model:value="formState.username"
                  :placeholder="t('user.username')"
                  disabled
                />
              </a-form-item>
              <a-form-item :label="t('user.phone')" name="phone">
                <a-input
                  v-model:value="formState.phone"
                  :placeholder="t('profile.phonePlaceholder')"
                  :maxlength="20"
                />
              </a-form-item>
              <a-form-item :label="t('user.email')" name="email">
                <a-input
                  v-model:value="formState.email"
                  :placeholder="t('profile.emailPlaceholder')"
                  type="text"
                  autocomplete="email"
                />
              </a-form-item>
              <a-form-item :label="t('user.remark')" name="remark">
                <a-textarea
                  v-model:value="formState.remark"
                  :placeholder="t('profile.remarkPlaceholder')"
                  :rows="3"
                  :maxlength="500"
                  show-count
                />
              </a-form-item>
              <!-- 只读：角色、机构、科室（展示为禁用输入框） -->
              <a-form-item :label="t('user.roles')">
                <a-input :value="roleLabel" disabled />
              </a-form-item>
              <a-form-item :label="t('user.org')">
                <a-input :value="user.org_id || '–'" disabled />
              </a-form-item>
              <a-form-item :label="t('user.dept')">
                <a-input :value="user.dept_id || '–'" disabled />
              </a-form-item>
              <a-form-item>
                <a-button type="primary" html-type="submit" :loading="submitting">
                  {{ t('common.save') }}
                </a-button>
                <a-button class="ml-2" @click="refreshUser">
                  {{ t('common.refresh') }}
                </a-button>
              </a-form-item>
            </a-form>
          </a-card>

          <!-- 右侧：个人资料实时预览 -->
          <a-card class="lg:col-span-2 profile-preview-card" :title="t('profile.previewTitle')">
            <div class="profile-preview">
              <div class="preview-avatar-wrap flex justify-center mb-4">
                <div
                  class="w-24 h-24 rounded-full bg-[var(--color-fill-quaternary)] border-2 border-[var(--color-border)] flex items-center justify-center overflow-hidden"
                >
                  <template v-if="preview.avatar_url">
                    <img
                      :src="preview.avatar_url"
                      :alt="t('avatar.avatar')"
                      class="w-full h-full object-cover"
                    />
                  </template>
                  <template v-else>
                    <UserOutlined class="text-4xl text-[var(--color-text-tertiary)]" />
                  </template>
                </div>
              </div>
              <dl class="preview-fields space-y-3">
                <div>
                  <dt class="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wide">
                    {{ t('user.realName') }}
                  </dt>
                  <dd class="mt-0.5 text-[var(--color-text)] font-medium">
                    {{ preview.real_name || '–' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wide">
                    {{ t('user.username') }}
                  </dt>
                  <dd class="mt-0.5 text-[var(--color-text)]">
                    {{ preview.username || '–' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wide">
                    {{ t('user.phone') }}
                  </dt>
                  <dd class="mt-0.5 text-[var(--color-text)]">
                    {{ preview.phone || '–' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wide">
                    {{ t('user.email') }}
                  </dt>
                  <dd class="mt-0.5 text-[var(--color-text)]">
                    {{ preview.email || '–' }}
                  </dd>
                </div>
                <div v-if="preview.remark">
                  <dt class="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wide">
                    {{ t('user.remark') }}
                  </dt>
                  <dd class="mt-0.5 text-[var(--color-text)] whitespace-pre-wrap break-words">
                    {{ preview.remark }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wide">
                    {{ t('user.roles') }}
                  </dt>
                  <dd class="mt-0.5 text-[var(--color-text)]">
                    {{ roleLabel }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wide">
                    {{ t('user.org') }}
                  </dt>
                  <dd class="mt-0.5 text-[var(--color-text)]">
                    {{ user.org_id || '–' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wide">
                    {{ t('user.dept') }}
                  </dt>
                  <dd class="mt-0.5 text-[var(--color-text)]">
                    {{ user.dept_id || '–' }}
                  </dd>
                </div>
              </dl>
            </div>
          </a-card>
        </div>
      </template>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api/auth'
import { uploadAvatar } from '@/api/upload'
import { message } from 'ant-design-vue'
import { UserOutlined } from '@ant-design/icons-vue'
import type { UserRole } from '@/types/auth'
import { normalizeAuthUser } from '@/utils/authUser'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const loading = ref(false)
const submitting = ref(false)
const avatarUploading = ref(false)
const formRef = ref<FormInstance>()
const fileInputRef = ref<HTMLInputElement>()

const ROLE_LABEL_KEYS: Record<UserRole, string> = {
  sysadmin: 'user.roleSysadmin',
  org_admin: 'user.roleOrgAdmin',
  dept_admin: 'user.roleDeptAdmin',
  user: 'user.roleUser',
}

const roleLabel = computed(() => {
  const r = user.value?.role
  return r ? t(ROLE_LABEL_KEYS[r]) : '–'
})

const formState = reactive<{
  real_name: string
  avatar_url: string
  username: string
  phone: string
  email: string
  remark: string
}>({
  real_name: '',
  avatar_url: '',
  username: '',
  phone: '',
  email: '',
  remark: '',
})

/** 右侧实时预览：随 formState 变化 */
const preview = computed(() => ({
  real_name: formState.real_name.trim() || user.value?.full_name || '',
  avatar_url: formState.avatar_url || user.value?.avatar_url || '',
  username: formState.username || user.value?.username || '',
  phone: formState.phone.trim() || user.value?.phone || '',
  email: formState.email.trim() || user.value?.email || '',
  remark: formState.remark.trim() || '',
}))

const formRules: Record<string, Rule[]> = {
  real_name: [
    { required: true, message: t('common.required'), trigger: 'blur' },
    { max: 50, message: t('common.max100'), trigger: 'blur' },
  ],
  email: [{ type: 'email', message: t('user.emailInvalid'), trigger: 'blur' }],
}

watch(
  user,
  (u) => {
    if (u) {
      formState.real_name = u.full_name || ''
      formState.avatar_url = u.avatar_url || ''
      formState.username = u.username || ''
      formState.phone = u.phone || ''
      formState.email = u.email || ''
      formState.remark = u.remark || ''
    }
  },
  { immediate: true }
)

function triggerAvatarInput() {
  fileInputRef.value?.click()
}

async function onAvatarFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const accept = 'image/jpeg,image/png,image/gif,image/webp'
  if (
    !accept
      .split(',')
      .map((s) => s.trim())
      .includes(file.type)
  )
    return
  avatarUploading.value = true
  try {
    const res = await uploadAvatar(file)
    formState.avatar_url = res.url
  } catch {
    message.error(t('profile.saveFailed'))
  } finally {
    avatarUploading.value = false
  }
}

async function refreshUser(silent = false) {
  if (!user.value) return
  loading.value = true
  try {
    await authStore.fetchUserInfo()
    const u = authStore.user
    if (u) {
      formState.real_name = u.full_name || ''
      formState.avatar_url = u.avatar_url || ''
      formState.username = u.username || ''
      formState.phone = u.phone || ''
      formState.email = u.email || ''
      formState.remark = u.remark || ''
    }
    if (!silent) message.success(t('profile.refreshSuccess'))
  } catch {
    message.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  const u = user.value
  if (!u) return
  submitting.value = true
  try {
    const payload = {
      real_name: formState.real_name.trim(),
      ...(formState.avatar_url ? { avatar_url: formState.avatar_url.trim() } : {}),
      phone: formState.phone.trim() || undefined,
      email: formState.email.trim() || undefined,
      remark: formState.remark.trim() || undefined,
    }
    const res = await authApi.updateMe(payload)
    const normalized = normalizeAuthUser({
      ...res,
      has_expert_avatar: u.has_expert_avatar,
      has_dept_avatar: u.has_dept_avatar,
      has_org_avatar: u.has_org_avatar,
    })
    authStore.setUser(normalized)
    message.success(t('profile.saveSuccess'))
  } catch {
    message.error(t('profile.saveFailed'))
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (user.value) {
    refreshUser(true)
  }
})
</script>

<style scoped>
.profile-page {
  max-width: 1200px;
}
.profile-layout :deep(.ant-card-body) {
  padding: var(--spacing-4, 1rem);
}
.profile-preview-card {
  position: sticky;
  top: 1rem;
}
.preview-fields dd {
  word-break: break-word;
}
</style>
