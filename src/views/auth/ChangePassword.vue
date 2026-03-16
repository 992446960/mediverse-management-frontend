<template>
  <div class="change-pwd-page" :class="{ 'is-dark': isDark }">
    <div class="change-pwd-page__bg-orb change-pwd-page__bg-orb--1" aria-hidden="true" />
    <div class="change-pwd-page__bg-orb change-pwd-page__bg-orb--2" aria-hidden="true" />
    <div class="change-pwd-page__bg-orb change-pwd-page__bg-orb--3" aria-hidden="true" />

    <div class="change-pwd-page__mode-toggle" role="region" :aria-label="t('auth.toggleThemeAria')">
      <ThemeSwitcher />
    </div>

    <div class="change-pwd-page__card">
      <div class="change-pwd-page__header">
        <h2 class="change-pwd-page__title">{{ t('auth.changePasswordTitle') }}</h2>
        <p class="change-pwd-page__subtitle">{{ t('auth.changePasswordSubtitle') }}</p>
      </div>

      <a-form
        :model="formState"
        name="change-password"
        class="change-pwd-page__form"
        layout="vertical"
        @finish="handleChangePassword"
      >
        <a-form-item
          :label="t('auth.oldPassword')"
          name="old_password"
          :rules="[{ required: true, message: t('auth.oldPasswordRequired') }]"
        >
          <a-input-password
            v-model:value="formState.old_password"
            :placeholder="t('auth.oldPasswordPlaceholder')"
            size="large"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item
          :label="t('auth.newPassword')"
          name="new_password"
          :rules="[{ required: true, message: t('auth.newPasswordRequired') }]"
        >
          <a-input-password
            v-model:value="formState.new_password"
            :placeholder="t('auth.newPasswordPlaceholder')"
            size="large"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item
          :label="t('auth.confirmPassword')"
          name="confirm_password"
          :rules="[{ required: true, message: t('auth.confirmPasswordRequired') }]"
        >
          <a-input-password
            v-model:value="formState.confirm_password"
            :placeholder="t('auth.confirmPasswordPlaceholder')"
            size="large"
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            class="change-pwd-page__submit-btn"
            :loading="loading"
            size="large"
            block
          >
            {{ t('auth.confirmChangeButton') }}
          </a-button>
        </a-form-item>
      </a-form>

      <div class="change-pwd-page__skip">
        <button type="button" class="change-pwd-page__skip-link" @click="goLater">
          {{ t('auth.changePasswordSkip') }}
        </button>
        <p class="change-pwd-page__skip-hint">{{ t('auth.changePasswordSkipHint') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { LockOutlined } from '@ant-design/icons-vue'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { setSkipChangePassword } from '@/utils/auth'
import ThemeSwitcher from '@/components/ThemeSwitcher/index.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const isDark = computed(() => themeStore.isDark)

const formState = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

const loading = ref(false)

async function handleChangePassword() {
  if (formState.new_password !== formState.confirm_password) {
    message.error(t('auth.passwordMismatch'))
    return
  }
  if (formState.new_password.length < 8) {
    message.error(t('auth.passwordMinLength'))
    return
  }

  loading.value = true
  try {
    await authApi.changePassword({
      old_password: formState.old_password,
      new_password: formState.new_password,
      confirm_password: formState.confirm_password,
    })
    message.success(t('auth.changePasswordSuccess'))
    await authStore.logout()
    router.push('/login')
  } catch (error: unknown) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

function goLater() {
  setSkipChangePassword()
  const redirect = (route.query.redirect as string) || '/'
  router.push(redirect)
}
</script>

<style scoped>
/* ── Container ── */
.change-pwd-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--login-bg);
  overflow: hidden;
}

.change-pwd-page__bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}

.change-pwd-page__bg-orb--1 {
  width: 320px;
  height: 320px;
  top: -80px;
  left: 10%;
  background: var(--login-orb-1);
}

.change-pwd-page__bg-orb--2 {
  width: 280px;
  height: 280px;
  bottom: 10%;
  right: 5%;
  background: var(--login-orb-2);
}

.change-pwd-page__bg-orb--3 {
  width: 200px;
  height: 200px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--login-orb-3);
}

.change-pwd-page__mode-toggle {
  position: absolute;
  top: var(--spacing-lg);
  right: var(--spacing-lg);
  z-index: 10;
}

/* ── Card ── */
.change-pwd-page__card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  padding: var(--spacing-2xl);
  background: var(--login-card-bg);
  border: 1px solid var(--login-card-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--login-card-shadow);
}

.change-pwd-page__header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.change-pwd-page__title {
  font-size: 24px;
  font-weight: 600;
  color: var(--login-title-color);
  margin: 0 0 var(--spacing-sm);
}

.change-pwd-page__subtitle {
  font-size: 14px;
  color: var(--login-subtitle-color);
  margin: 0;
}

.change-pwd-page__form :deep(.ant-input-password) {
  background: var(--login-input-bg) !important;
  border-color: var(--login-input-border) !important;
  color: var(--login-input-text) !important;
}

.change-pwd-page__form :deep(.ant-input-password input) {
  background: transparent !important;
  color: var(--login-input-text) !important;
}

.change-pwd-page__form :deep(.ant-input-password .ant-input-password-icon) {
  color: var(--login-icon-color);
}

.change-pwd-page__submit-btn {
  margin-top: var(--spacing-sm);
}

.change-pwd-page__skip {
  text-align: center;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.change-pwd-page__skip-link {
  color: var(--color-primary);
  cursor: pointer;
  font-size: 14px;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  text-decoration: underline;
}

.change-pwd-page__skip-link:hover {
  color: var(--color-primary-hover);
}

.change-pwd-page__skip-hint {
  margin: var(--spacing-sm) 0 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
}

/* 覆盖浏览器 autofill 默认背景，与登录页一致 */
.change-pwd-page :deep(.ant-input:-webkit-autofill),
.change-pwd-page :deep(.ant-input-affix-wrapper input:-webkit-autofill),
.change-pwd-page :deep(.ant-input:-webkit-autofill:hover),
.change-pwd-page :deep(.ant-input:-webkit-autofill:focus),
.change-pwd-page :deep(.ant-input:-webkit-autofill:active),
.change-pwd-page :deep(.ant-input-affix-wrapper input:-webkit-autofill:hover),
.change-pwd-page :deep(.ant-input-affix-wrapper input:-webkit-autofill:focus),
.change-pwd-page :deep(.ant-input-affix-wrapper input:-webkit-autofill:active) {
  background-color: var(--login-input-autofill-cover) !important;
  -webkit-box-shadow: 0 0 0 1000px var(--login-input-autofill-cover) inset !important;
  box-shadow: 0 0 0 1000px var(--login-input-autofill-cover) inset !important;
  -webkit-text-fill-color: var(--login-input-text) !important;
  caret-color: var(--login-input-text);
}
</style>
