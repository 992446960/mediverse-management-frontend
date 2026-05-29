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
        <a-row :gutter="[24, 24]" class="profile-layout">
          <a-col :span="24">
            <div
              class="page-header app-container p-4 flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <h1 class="text-xl font-semibold text-[var(--color-text)]">
                  {{ t('profile.formTitle') }}
                </h1>
                <p class="text-sm text-[var(--color-text-secondary)] mt-1">
                  {{ t('profile.editHint') }}
                </p>
              </div>
              <a
                class="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] flex items-center gap-1.5 text-sm cursor-pointer"
                @click="changePasswordOpen = true"
              >
                <LockOutlined />
                {{ t('profile.changePassword') }}
              </a>
            </div>
          </a-col>
          <!-- 左侧：全部表单 -->
          <a-col :xs="24" :lg="18">
            <a-card class="h-full">
              <a-form
                :model="formState"
                :rules="formRules"
                layout="vertical"
                @finish="handleSubmit"
              >
                <div class="profile-form-stack">
                  <section class="profile-section">
                    <SectionTitle :title="t('profile.changeAvatar')" />
                    <input
                      ref="fileInputRef"
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      style="display: none"
                      aria-hidden="true"
                      @change="onAvatarFileChange"
                    />
                    <a-form-item name="avatar_url" class="profile-section__form-item">
                      <AvatarUploadPanel
                        :image-url="avatarDisplayUrl"
                        :title="t('profile.changeAvatar')"
                        :action-text="t('common.selectFile')"
                        :hint="t('profile.avatarFormatHint')"
                        :loading="avatarUploading"
                        @upload="triggerAvatarInput"
                      />
                    </a-form-item>
                  </section>

                  <section class="profile-section">
                    <SectionTitle :title="t('avatar.wizard.basicInfo')" />
                    <div class="profile-section__body">
                      <a-row :gutter="[16, 16]">
                        <a-col :xs="24" :sm="12">
                          <a-form-item :label="t('user.realName')" name="real_name">
                            <a-input
                              v-model:value="formState.real_name"
                              :placeholder="t('user.realName')"
                              :maxlength="50"
                              show-count
                            />
                          </a-form-item>
                        </a-col>
                        <a-col :xs="24" :sm="12">
                          <a-form-item :label="t('user.username')" name="username">
                            <a-input
                              v-model:value="formState.username"
                              :placeholder="t('user.username')"
                              disabled
                            />
                          </a-form-item>
                        </a-col>
                        <a-col :xs="24" :sm="12">
                          <a-form-item :label="t('user.phone')" name="phone">
                            <a-input
                              v-model:value="formState.phone"
                              :placeholder="t('profile.phonePlaceholder')"
                              :maxlength="20"
                              addon-before="+86"
                            />
                          </a-form-item>
                        </a-col>
                        <a-col :xs="24" :sm="12">
                          <a-form-item :label="t('user.email')" name="email">
                            <a-input
                              v-model:value="formState.email"
                              :placeholder="t('profile.emailPlaceholder')"
                              type="text"
                              autocomplete="email"
                            />
                          </a-form-item>
                        </a-col>
                      </a-row>
                    </div>
                  </section>

                  <section class="profile-section">
                    <SectionTitle :title="t('user.remark')" />
                    <div class="profile-section__body">
                      <a-form-item :label="t('user.remark')" name="remark">
                        <a-textarea
                          v-model:value="formState.remark"
                          :placeholder="t('profile.remarkPlaceholder')"
                          :rows="3"
                          :maxlength="500"
                          show-count
                        />
                      </a-form-item>
                    </div>
                  </section>

                  <div class="profile-actions">
                    <a-button type="primary" html-type="submit" :loading="submitting">
                      {{ t('profile.saveChanges') }}
                    </a-button>
                    <a-button html-type="button" @click="refreshUser">
                      {{ t('common.refresh') }}
                    </a-button>
                  </div>
                </div>
              </a-form>
            </a-card>
          </a-col>

          <!-- 右侧：个人名片预览 -->
          <a-col :xs="24" :lg="6">
            <a-card class="profile-preview-card" :title="t('profile.previewTitle')">
              <div class="profile-preview">
                <IdentitySummary
                  :name="previewName"
                  :avatar-url="previewAvatarUrl"
                  :scope="previewScope"
                  :status-text="user.is_active ? t('status.active') : t('status.inactive')"
                  :status-color="user.is_active ? 'success' : 'error'"
                  :tags="previewTags"
                />

                <section class="profile-preview__section">
                  <SectionTitle :title="t('avatar.wizard.basicInfo')" />
                  <ReadonlyDescription :items="previewItems" />
                </section>
              </div>
            </a-card>
          </a-col>
        </a-row>
      </template>
    </a-spin>

    <!-- 修改密码弹窗 -->
    <a-modal
      v-model:open="changePasswordOpen"
      :title="t('auth.changePasswordTitle')"
      :confirm-loading="changePasswordLoading"
      :ok-text="t('auth.confirmChangeButton')"
      :cancel-text="t('common.cancel')"
      destroy-on-close
      @ok="handleChangePasswordOk"
      @cancel="changePasswordFormRef?.resetForm?.()"
    >
      <ChangePasswordForm
        ref="changePasswordFormRef"
        hide-submit-button
        @success="onChangePasswordSuccess"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api/auth'
import { toAbsoluteFileUrl, uploadAvatar } from '@/api/upload'
import { message } from 'ant-design-vue'
import { LockOutlined } from '@ant-design/icons-vue'
import type { UserRole } from '@/types/auth'
import { normalizeAuthUser, mergeUserWithWorkbenchFlags } from '@/utils/authUser'
import type { Rule } from 'ant-design-vue/es/form'
import AvatarUploadPanel from '@/components/AvatarUploadPanel/index.vue'
import ChangePasswordForm from '@/components/ChangePasswordForm/index.vue'
import IdentitySummary from '@/components/IdentitySummary/index.vue'
import ReadonlyDescription from '@/components/ReadonlyDescription/index.vue'
import SectionTitle from '@/components/SectionTitle/index.vue'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const loading = ref(false)
const submitting = ref(false)
const avatarUploading = ref(false)
const fileInputRef = ref<HTMLInputElement>()
const changePasswordOpen = ref(false)
const changePasswordLoading = ref(false)
const changePasswordFormRef = ref<InstanceType<typeof ChangePasswordForm>>()

const ROLE_LABEL_KEYS: Record<UserRole, string> = {
  sysadmin: 'user.roleSysadmin',
  org_admin: 'user.roleOrgAdmin',
  dept_admin: 'user.roleDeptAdmin',
  user: 'user.roleUser',
}

interface ReadonlyDescriptionItem {
  label: string
  value?: string | number | string[] | null
  span?: 1 | 2
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

/** 头像展示 URL：相对路径转完整地址，保证跨环境回显 */
const avatarDisplayUrl = computed(() =>
  formState.avatar_url ? toAbsoluteFileUrl(formState.avatar_url) : ''
)

/** 右侧实时预览：随 formState 变化 */
const preview = computed(() => ({
  real_name: formState.real_name.trim() || user.value?.full_name || '',
  avatar_url: formState.avatar_url || user.value?.avatar_url || '',
  username: formState.username || user.value?.username || '',
  phone: formState.phone.trim() || user.value?.phone || '',
  email: formState.email.trim() || user.value?.email || '',
  remark: formState.remark.trim() || '',
}))

const previewName = computed(() => preview.value.real_name || preview.value.username || '–')

const previewAvatarUrl = computed(() =>
  preview.value.avatar_url ? toAbsoluteFileUrl(preview.value.avatar_url) : ''
)

const previewScope = computed(() =>
  [user.value?.org_name || user.value?.org_id, user.value?.dept_name || user.value?.dept_id]
    .filter(Boolean)
    .join(' / ')
)

const previewTags = computed(() => (roleLabel.value === '–' ? [] : [roleLabel.value]))

const previewItems = computed<ReadonlyDescriptionItem[]>(() => [
  { label: t('user.username'), value: preview.value.username },
  { label: t('user.phone'), value: preview.value.phone },
  { label: t('user.email'), value: preview.value.email },
  { label: t('user.org'), value: user.value?.org_name || user.value?.org_id },
  { label: t('user.dept'), value: user.value?.dept_name || user.value?.dept_id },
  { label: t('user.remark'), value: preview.value.remark, span: 2 },
])

const formRules: Record<string, Rule[]> = {
  real_name: [
    { required: true, message: t('common.required'), trigger: 'blur' },
    { max: 50, message: t('common.max100'), trigger: 'blur' },
  ],
  phone: [
    {
      validator: (_: unknown, value: string) => {
        if (!value || !value.trim()) return Promise.resolve()
        return /^1\d{10}$/.test(value.trim())
          ? Promise.resolve()
          : Promise.reject(new Error(t('user.phoneInvalid')))
      },
      trigger: 'blur',
    },
  ],
  email: [
    {
      validator: (_: unknown, value: string) => {
        if (!value || !value.trim()) return Promise.resolve()
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(value.trim())
          ? Promise.resolve()
          : Promise.reject(new Error(t('user.emailInvalid')))
      },
      trigger: 'blur',
    },
  ],
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

async function handleChangePasswordOk() {
  try {
    changePasswordLoading.value = true
    await changePasswordFormRef.value?.submitForm?.()
  } finally {
    changePasswordLoading.value = false
  }
}

async function onChangePasswordSuccess() {
  changePasswordOpen.value = false
  changePasswordFormRef.value?.resetForm?.()
  await authStore.logout()
  router.push('/login')
}

const AVATAR_MAX_SIZE = 2 * 1024 * 1024 // 2MB

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
  if (file.size > AVATAR_MAX_SIZE) {
    message.error(t('profile.avatarSizeExceeded'))
    return
  }
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
    // 兼容 data 直接为用户对象 或 data: { user } 两种返回结构
    const merged = mergeUserWithWorkbenchFlags({
      ...(typeof res === 'object' && res && 'user' in res ? res : { user: res }),
      has_expert_avatar: u.has_expert_avatar,
      has_dept_avatar: u.has_dept_avatar,
      has_org_avatar: u.has_org_avatar,
    })
    const normalized = normalizeAuthUser(merged)
    authStore.setUser(normalized)
    // 用返回数据回显表单，避免再请求 /auth/me
    formState.real_name = normalized.full_name || ''
    formState.avatar_url = normalized.avatar_url || ''
    formState.username = normalized.username || ''
    formState.phone = normalized.phone || ''
    formState.email = normalized.email || ''
    formState.remark = normalized.remark || ''
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

<style scoped lang="scss">
.profile-page {
  width: 100%;
  min-width: 0;
}
.profile-layout :deep(.ant-card-body) {
  padding: var(--spacing-4, 1rem);
}

.profile-form-stack {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.profile-section {
  min-width: 0;
}

.profile-section :deep(.section-title) {
  margin-bottom: var(--spacing-md);
}

.profile-section__body {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-container);
}

.profile-section__body :deep(.ant-form-item:last-child),
.profile-section__form-item {
  margin-bottom: 0;
}

.profile-section :deep(.avatar-upload-panel__hint) {
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
}

.profile-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.profile-preview-card {
  position: sticky;
  top: 1rem;
  width: 100%;
}

.profile-preview {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.profile-preview :deep(.identity-summary) {
  align-items: flex-start;
}

.profile-preview__section :deep(.section-title) {
  margin-bottom: var(--spacing-md);
}

.profile-preview__section :deep(.readonly-description) {
  grid-template-columns: 1fr;
  gap: var(--spacing-sm);
}

.profile-preview__section :deep(.readonly-description__item--wide) {
  grid-column: span 1;
}

@media (max-width: 992px) {
  .profile-preview-card {
    position: static;
  }
}
</style>
