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
                ref="formRef"
                :model="formState"
                :rules="formRules"
                layout="vertical"
                @finish="handleSubmit"
              >
                <!-- 头像上传：大图 + 相机叠加 + 右侧文案 -->
                <a-row :gutter="[16, 16]">
                  <a-col :span="24">
                    <a-form-item name="avatar_url">
                      <div class="profile-avatar-section flex items-start gap-6">
                        <input
                          ref="fileInputRef"
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          style="display: none"
                          aria-hidden="true"
                          @change="onAvatarFileChange"
                        />
                        <div
                          class="profile-avatar-wrap relative shrink-0 cursor-pointer"
                          :class="{ 'pointer-events-none opacity-70': avatarUploading }"
                          @click="onAvatarCardClick"
                        >
                          <div
                            class="profile-avatar-circle relative w-24 h-24 rounded-full bg-[var(--color-primary-100)] border-2 border-[var(--color-primary-200)] flex items-center justify-center overflow-hidden"
                          >
                            <div
                              v-if="avatarUploading"
                              class="absolute inset-0 flex items-center justify-center z-10 bg-white/70 rounded-full"
                            >
                              <a-spin />
                            </div>
                            <template v-else-if="formState.avatar_url">
                              <a-image
                                :src="avatarDisplayUrl"
                                :alt="t('avatar.avatar')"
                                class="profile-avatar-a-image w-full h-full [&_.ant-image]:block! [&_.ant-image-img]:w-full! [&_.ant-image-img]:h-full! [&_.ant-image-img]:object-cover!"
                              />
                            </template>
                            <template v-else>
                              <UserOutlined class="text-4xl" style="color: var(--color-primary)" />
                            </template>
                          </div>
                          <!-- 右下角相机图标叠加，点击上传/更换 -->
                          <div
                            v-show="!avatarUploading"
                            class="profile-avatar-camera-btn absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center cursor-pointer border-2 border-white shadow-sm hover:bg-[var(--color-primary-hover)] transition-colors"
                            @click.stop="triggerAvatarInput"
                          >
                            <CameraOutlined class="text-white text-sm" />
                          </div>
                        </div>
                        <div class="profile-avatar-text flex flex-col justify-center min-w-0">
                          <h4 class="text-base font-medium text-[var(--color-text)] m-0">
                            {{ t('profile.changeAvatar') }}
                          </h4>
                          <p class="text-sm text-[var(--color-text-tertiary)] mt-1 mb-0">
                            {{ t('profile.avatarFormatHint') }}
                          </p>
                        </div>
                      </div>
                    </a-form-item>
                  </a-col>
                </a-row>
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
                </a-row>
                <a-row :gutter="[16, 16]">
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
                <a-row :gutter="[16, 16]">
                  <a-col :span="24">
                    <a-form-item :label="t('user.remark')" name="remark">
                      <a-textarea
                        v-model:value="formState.remark"
                        :placeholder="t('profile.remarkPlaceholder')"
                        :rows="3"
                        :maxlength="500"
                        show-count
                      />
                    </a-form-item>
                  </a-col>
                </a-row>
                <a-row :gutter="[16, 16]">
                  <a-col :span="24">
                    <a-form-item>
                      <a-button type="primary" html-type="submit" :loading="submitting">
                        {{ t('profile.saveChanges') }}
                      </a-button>
                      <a-button class="ml-2" @click="refreshUser">
                        {{ t('common.refresh') }}
                      </a-button>
                    </a-form-item>
                  </a-col>
                </a-row>
              </a-form>
            </a-card>
          </a-col>

          <!-- 右侧：个人名片预览 -->
          <a-col :xs="24" :lg="6">
            <a-card class="profile-preview-card" :title="t('profile.previewTitle')">
              <div class="profile-preview flex flex-col items-center w-full">
                <!-- 头像 + 姓名 + 角色 -->
                <div class="preview-header flex flex-col items-center text-center mb-5">
                  <div class="preview-avatar-wrap">
                    <div
                      class="w-20 h-20 rounded-full bg-[var(--color-primary-100)] border-2 border-[var(--color-primary-200)] flex items-center justify-center overflow-hidden"
                    >
                      <template v-if="preview.avatar_url">
                        <a-image
                          :src="toAbsoluteFileUrl(preview.avatar_url)"
                          :alt="t('avatar.avatar')"
                          class="w-full h-full [&_.ant-image]:block! [&_.ant-image-img]:w-full! [&_.ant-image-img]:h-full! [&_.ant-image-img]:object-cover!"
                        />
                      </template>
                      <template v-else>
                        <UserOutlined class="text-3xl" style="color: var(--color-primary)" />
                      </template>
                    </div>
                  </div>
                  <h3 class="mt-3 text-lg font-semibold text-[var(--color-text)]">
                    {{ preview.real_name || preview.username || '–' }}
                  </h3>
                  <span
                    class="mt-1.5 inline-block px-3 py-0.5 rounded-full text-xs font-medium text-white bg-[var(--color-primary)]"
                  >
                    {{ roleLabel }}
                  </span>
                </div>
                <!-- 信息卡片 -->
                <div class="preview-cards space-y-3 w-full">
                  <div class="preview-card">
                    <div class="preview-card-icon">
                      <PhoneOutlined class="text-lg" style="color: var(--color-primary)" />
                    </div>
                    <div class="preview-card-content">
                      <span class="preview-card-label">{{ t('user.phone') }}</span>
                      <span class="preview-card-value">{{ preview.phone || '–' }}</span>
                    </div>
                  </div>
                  <div class="preview-card">
                    <div class="preview-card-icon">
                      <MailOutlined class="text-lg" style="color: var(--color-primary)" />
                    </div>
                    <div class="preview-card-content">
                      <span class="preview-card-label">{{ t('user.email') }}</span>
                      <span class="preview-card-value">{{ preview.email || '–' }}</span>
                    </div>
                  </div>
                  <div v-if="user.org_id" class="preview-card">
                    <div class="preview-card-icon">
                      <BankOutlined class="text-lg" style="color: var(--color-primary)" />
                    </div>
                    <div class="preview-card-content">
                      <span class="preview-card-label">{{ t('user.org') }}</span>
                      <span class="preview-card-value">{{
                        user.org_name || user.org_id || '–'
                      }}</span>
                    </div>
                  </div>
                  <div class="preview-card">
                    <div class="preview-card-icon">
                      <ApartmentOutlined class="text-lg" style="color: var(--color-primary)" />
                    </div>
                    <div class="preview-card-content">
                      <span class="preview-card-label">{{ t('user.dept') }}</span>
                      <span class="preview-card-value">{{
                        user.dept_name || user.dept_id || '–'
                      }}</span>
                    </div>
                  </div>
                  <div v-if="preview.remark" class="preview-card">
                    <div class="preview-card-icon">
                      <FileTextOutlined class="text-lg" style="color: var(--color-primary)" />
                    </div>
                    <div class="preview-card-content">
                      <span class="preview-card-label">{{ t('user.remark') }}</span>
                      <span class="preview-card-value preview-card-value-multiline">{{
                        preview.remark
                      }}</span>
                    </div>
                  </div>
                </div>
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
import {
  ApartmentOutlined,
  BankOutlined,
  CameraOutlined,
  FileTextOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import type { UserRole } from '@/types/auth'
import { normalizeAuthUser, mergeUserWithWorkbenchFlags } from '@/utils/authUser'
import type { FormInstance, Rule } from 'ant-design-vue/es/form'
import ChangePasswordForm from '@/components/ChangePasswordForm/index.vue'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const loading = ref(false)
const submitting = ref(false)
const avatarUploading = ref(false)
const formRef = ref<FormInstance>()
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

function onAvatarCardClick() {
  if (formState.avatar_url) return
  triggerAvatarInput()
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

<style scoped>
.profile-page {
  width: 100%;
  min-width: 680px;
}
.profile-layout :deep(.ant-card-body) {
  padding: var(--spacing-4, 1rem);
}
/* 头像上传区域 */
.profile-avatar-section {
  padding: 4px 0;
}
.profile-avatar-camera-btn :deep(.anticon) {
  color: white !important;
}
.profile-avatar-camera-btn :deep(.anticon svg) {
  fill: currentColor;
}
.profile-preview-col {
  display: flex;
  justify-content: center;
}
.profile-preview-card {
  position: sticky;
  top: 1rem;
  width: 100%;
}
/* 个人名片预览：头像区域 */
.preview-avatar-wrap {
  position: relative;
}
/* 个人名片预览：信息卡片 */
.preview-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  background: var(--color-bg-layout, #f1f5f9);
  border-radius: var(--radius-sm, 8px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.preview-card-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-100);
  border-radius: 8px;
}
.preview-card-icon :deep(.anticon) {
  color: var(--color-primary) !important;
}
.preview-card-icon :deep(.anticon svg) {
  fill: currentColor;
}
.preview-card-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.preview-card-label {
  font-size: 12px;
  color: var(--color-text-tertiary);
}
.preview-card-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}
.preview-card-value-multiline {
  white-space: pre-wrap;
  word-break: break-word;
  font-weight: 400;
}
</style>
