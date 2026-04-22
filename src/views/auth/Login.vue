<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { message } from 'ant-design-vue'
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue'
import ThemeSwitcher from '@/components/ThemeSwitcher/index.vue'
import logoUrl from '@/assets/logo.svg?url'

const LOGIN_REMEMBER_KEY = 'login_remember'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const isDark = computed(() => themeStore.isDark)

const formState = reactive({
  username: '',
  password: '',
  rememberMe: false,
})
const loading = ref(false)

function loadRemembered() {
  try {
    const raw = localStorage.getItem(LOGIN_REMEMBER_KEY)
    if (!raw) return
    const data = JSON.parse(raw) as { username?: string; password?: string }
    if (data.username) formState.username = data.username
    if (data.password) formState.password = data.password
    formState.rememberMe = true
  } catch {
    // ignore
  }
}

function saveRemembered() {
  if (!formState.rememberMe) {
    localStorage.removeItem(LOGIN_REMEMBER_KEY)
    return
  }
  localStorage.setItem(
    LOGIN_REMEMBER_KEY,
    JSON.stringify({
      username: formState.username,
      password: formState.password,
    })
  )
}

onMounted(loadRemembered)

const handleLogin = async () => {
  if (!formState.username || !formState.password) {
    message.warning(t('auth.pleaseEnterUsernameAndPassword'))
    return
  }
  loading.value = true
  try {
    await authStore.login({ username: formState.username, password: formState.password })
    saveRemembered()
    message.success(t('auth.loginSuccess'))
    router.push((route.query.redirect as string) || '/')
  } catch (error: unknown) {
    console.error(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container" :class="{ 'is-dark': isDark }">
    <div class="login-bg-image" aria-hidden="true" />
    <div class="bg-orb bg-orb--1" aria-hidden="true" />
    <div class="bg-orb bg-orb--2" aria-hidden="true" />
    <div class="bg-orb bg-orb--3" aria-hidden="true" />

    <div class="mode-toggle" role="region" :aria-label="t('auth.toggleThemeAria')">
      <ThemeSwitcher />
    </div>

    <div class="login-box">
      <div class="login-header">
        <div class="brand-icon" aria-hidden="true">
          <img class="brand-icon__img" :src="logoUrl" alt="" width="40" height="40" />
        </div>
        <h2 class="title">{{ t('app.brandName') }}</h2>
        <p class="subtitle">{{ t('auth.subtitle') }}</p>
      </div>

      <a-form :model="formState" name="login" class="login-form" @finish="handleLogin">
        <a-form-item
          name="username"
          :rules="[{ required: true, message: t('auth.usernamePlaceholder') }]"
        >
          <a-input
            v-model:value.trim="formState.username"
            :placeholder="t('auth.username')"
            size="large"
          >
            <template #prefix><UserOutlined /></template>
          </a-input>
        </a-form-item>

        <a-form-item
          name="password"
          :rules="[{ required: true, message: t('auth.passwordPlaceholder') }]"
        >
          <a-input-password
            v-model:value.trim="formState.password"
            :placeholder="t('auth.password')"
            size="large"
          >
            <template #prefix><LockOutlined /></template>
          </a-input-password>
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 0 }">
          <a-checkbox v-model:checked="formState.rememberMe">
            {{ t('auth.rememberPassword') }}
          </a-checkbox>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            class="login-button"
            :loading="loading"
            size="large"
            block
          >
            {{ t('auth.loginButton') }}
          </a-button>
        </a-form-item>
      </a-form>

      <p class="login-footer">{{ t('auth.footer') }}</p>
    </div>
  </div>
</template>

<style scoped>
/* ── Container ── */
.login-container {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--login-bg);
  overflow: hidden;
}

/* ── Background image（科技感数据中心图，cover 适配各尺寸）── */
.login-bg-image {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: url('/login-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  pointer-events: none;
}

.login-bg-image::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(2, 6, 23, 0.5) 0%, rgba(2, 6, 23, 0.65) 100%);
  pointer-events: none;
}

/* ── Background orbs ── */
.bg-orb {
  position: absolute;
  z-index: 0;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}

.bg-orb--1 {
  width: 520px;
  height: 520px;
  background: radial-gradient(circle, var(--login-orb-1) 0%, transparent 70%);
  top: -160px;
  right: -120px;
}

.bg-orb--2 {
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, var(--login-orb-2) 0%, transparent 70%);
  bottom: -100px;
  left: -80px;
}

.bg-orb--3 {
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, var(--login-orb-3) 0%, transparent 70%);
  top: 50%;
  left: 15%;
}

/* ── Mode toggle (top-right) ── */
.mode-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
}

/* ── Login card ── */
.login-box {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  margin: 24px;
  padding: 48px 40px 36px;
  background: var(--login-card-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--login-card-border);
  border-radius: 16px;
  box-shadow: var(--login-card-shadow);
  transition:
    background 0.3s ease,
    border-color 0.3s ease;
}

/* ── Header ── */
.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.brand-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.brand-icon__img {
  display: block;
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.title {
  font-size: 26px;
  font-weight: 700;
  color: var(--login-title-color);
  margin: 0 0 8px;
  letter-spacing: 0.5px;
  transition: color 0.3s;
}

.subtitle {
  font-size: 13px;
  color: var(--login-subtitle-color);
  margin: 0;
  letter-spacing: 0.3px;
  transition: color 0.3s;
}

/* ── Form ── */
.login-form {
  margin-top: 8px;
}

/* Dark mode: override Ant Design inputs with glassmorphic style */
.is-dark :deep(.ant-input-affix-wrapper),
.is-dark :deep(.ant-input) {
  background: var(--login-input-bg) !important;
  border-color: var(--login-input-border) !important;
  color: var(--login-input-text) !important;
}

.is-dark :deep(.ant-input-affix-wrapper:hover),
.is-dark :deep(.ant-input-affix-wrapper:focus-within) {
  border-color: var(--color-primary) !important;
  background: var(--login-input-bg) !important;
}

.is-dark :deep(.ant-input::placeholder),
.is-dark :deep(.ant-input-password input::placeholder) {
  color: var(--login-input-placeholder) !important;
}

.is-dark :deep(.anticon) {
  color: var(--login-icon-color);
}

/* 覆盖浏览器 autofill 默认背景 #E8F0FE，用不透明色 inset 阴影 + background 强制盖住 */
.login-container :deep(.ant-input:-webkit-autofill),
.login-container :deep(.ant-input-affix-wrapper input:-webkit-autofill),
.login-container :deep(.ant-input:-webkit-autofill:hover),
.login-container :deep(.ant-input:-webkit-autofill:focus),
.login-container :deep(.ant-input:-webkit-autofill:active),
.login-container :deep(.ant-input-affix-wrapper input:-webkit-autofill:hover),
.login-container :deep(.ant-input-affix-wrapper input:-webkit-autofill:focus),
.login-container :deep(.ant-input-affix-wrapper input:-webkit-autofill:active) {
  background-color: var(--login-input-autofill-cover) !important;
  -webkit-box-shadow: 0 0 0 1000px var(--login-input-autofill-cover) inset !important;
  box-shadow: 0 0 0 1000px var(--login-input-autofill-cover) inset !important;
  -webkit-text-fill-color: var(--login-input-text) !important;
  caret-color: var(--login-input-text);
  transition: background-color 5000s ease-in-out 0s;
}

:deep(.ant-form-item-explain-error) {
  color: var(--login-error-color);
}

/* ── Login button ── */
.login-button {
  margin-top: 8px;
  height: 44px !important;
  font-size: 15px !important;
  font-weight: 500 !important;
  letter-spacing: 3px !important;
  border-radius: 8px !important;
  transition: all 0.25s ease !important;
}

.login-button:not(:disabled):hover {
  transform: translateY(-1px);
}

/* ── Footer ── */
.login-footer {
  text-align: center;
  margin: 28px 0 0;
  font-size: 12px;
  color: var(--login-footer-color);
  letter-spacing: 0.2px;
  transition: color 0.3s;
}
</style>
