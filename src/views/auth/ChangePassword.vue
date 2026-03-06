<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { message } from 'ant-design-vue'
import { LockOutlined } from '@ant-design/icons-vue'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

const formState = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

const loading = ref(false)

const handleChangePassword = async () => {
  if (formState.new_password !== formState.confirm_password) {
    message.error(t('auth.passwordMismatch'))
    return
  }

  if (formState.new_password.length < 6) {
    message.error(t('auth.passwordMinLength'))
    return
  }

  loading.value = true
  try {
    await authApi.changePassword({
      old_password: formState.old_password,
      new_password: formState.new_password,
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
</script>

<template>
  <div class="change-pwd-container">
    <div class="change-pwd-box">
      <div class="header">
        <h2 class="title">{{ t('auth.changePasswordTitle') }}</h2>
        <p class="subtitle">{{ t('auth.changePasswordSubtitle') }}</p>
      </div>

      <a-form
        :model="formState"
        name="change-password"
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
          >
            <template #prefix>
              <LockOutlined />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit" :loading="loading" block>
            {{ t('auth.confirmChangeButton') }}
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<style scoped>
.change-pwd-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
}

.change-pwd-box {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.header {
  text-align: center;
  margin-bottom: 32px;
}

.title {
  font-size: 24px;
  color: rgba(0, 0, 0, 0.85);
  font-weight: 600;
  margin-bottom: 8px;
}

.subtitle {
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}
</style>
