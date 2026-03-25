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

      <ChangePasswordForm
        show-skip
        size="large"
        class="change-pwd-page__form"
        @success="onSuccess"
        @skip="goLater"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { setSkipChangePassword } from '@/utils/auth'
import ChangePasswordForm from '@/components/ChangePasswordForm/index.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher/index.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const isDark = computed(() => themeStore.isDark)

async function onSuccess() {
  await authStore.logout()
  router.push('/login')
}

function goLater() {
  const userId = authStore.user?.id
  if (userId) {
    setSkipChangePassword(userId)
  }
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
