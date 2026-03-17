<template>
  <a-form
    ref="formRef"
    :model="formState"
    name="change-password"
    layout="vertical"
    @finish="handleSubmit"
  >
    <a-form-item
      :label="t('auth.oldPassword')"
      name="old_password"
      :rules="[{ required: true, message: t('auth.oldPasswordRequired') }]"
    >
      <a-input-password
        v-model:value="formState.old_password"
        :placeholder="t('auth.oldPasswordPlaceholder')"
        :size="size"
      >
        <template #prefix>
          <LockOutlined />
        </template>
      </a-input-password>
    </a-form-item>

    <a-form-item :label="t('auth.newPassword')" name="new_password" :rules="newPasswordRules">
      <a-input-password
        v-model:value="formState.new_password"
        :placeholder="t('auth.newPasswordPlaceholder')"
        :size="size"
      >
        <template #prefix>
          <LockOutlined />
        </template>
      </a-input-password>
    </a-form-item>

    <a-form-item
      :label="t('auth.confirmPassword')"
      name="confirm_password"
      :rules="confirmPasswordRules"
    >
      <a-input-password
        v-model:value="formState.confirm_password"
        :placeholder="t('auth.confirmPasswordPlaceholder')"
        :size="size"
      >
        <template #prefix>
          <LockOutlined />
        </template>
      </a-input-password>
    </a-form-item>

    <a-form-item v-if="!hideSubmitButton">
      <a-button type="primary" html-type="submit" :loading="loading" :size="size" block>
        {{ t('auth.confirmChangeButton') }}
      </a-button>
    </a-form-item>

    <div v-if="showSkip" class="change-pwd-form__skip">
      <button type="button" class="change-pwd-form__skip-link" @click="emit('skip')">
        {{ t('auth.changePasswordSkip') }}
      </button>
      <p class="change-pwd-form__skip-hint">{{ t('auth.changePasswordSkipHint') }}</p>
    </div>
  </a-form>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { LockOutlined } from '@ant-design/icons-vue'
import { authApi } from '@/api/auth'
import type { FormInstance } from 'ant-design-vue'

interface Props {
  /** 是否显示「稍后修改」链接（用于强制改密页） */
  showSkip?: boolean
  /** 是否隐藏提交按钮（用于弹窗模式，按钮在 footer） */
  hideSubmitButton?: boolean
  /** 表单项尺寸 */
  size?: 'large' | 'middle' | 'small'
}

withDefaults(defineProps<Props>(), {
  showSkip: false,
  hideSubmitButton: false,
  size: 'middle',
})

const emit = defineEmits<{
  success: []
  skip: []
}>()

const { t } = useI18n()
const formRef = ref<FormInstance>()
const loading = ref(false)

const newPasswordRules = computed(() => [
  { required: true, message: t('auth.newPasswordRequired'), trigger: 'blur' },
  {
    validator: (_: unknown, value: string, callback: (err?: string) => void) => {
      if (!value || value.length >= 8) {
        callback()
      } else {
        callback(t('auth.passwordMinLength'))
      }
    },
    trigger: 'blur',
  },
])

const confirmPasswordRules = computed(() => [
  { required: true, message: t('auth.confirmPasswordRequired'), trigger: 'blur' },
  {
    validator: (_: unknown, value: string, callback: (err?: string) => void) => {
      if (!value || value === formState.new_password) {
        callback()
      } else {
        callback(t('auth.passwordMismatch'))
      }
    },
    trigger: 'blur',
  },
])

const formState = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

async function handleSubmit() {
  loading.value = true
  try {
    await authApi.changePassword({
      old_password: formState.old_password,
      new_password: formState.new_password,
      confirm_password: formState.confirm_password,
    })
    message.success(t('auth.changePasswordSuccess'))
    emit('success')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  formState.old_password = ''
  formState.new_password = ''
  formState.confirm_password = ''
  formRef.value?.clearValidate()
}

/** 校验并提交（用于弹窗模式，由 footer 确认按钮触发） */
async function submitForm() {
  await formRef.value?.validate()
  await handleSubmit()
}

defineExpose({
  resetForm,
  submitForm,
})
</script>

<style scoped>
.change-pwd-form__skip {
  text-align: center;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}
.change-pwd-form__skip-link {
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
.change-pwd-form__skip-link:hover {
  color: var(--color-primary-hover);
}
.change-pwd-form__skip-hint {
  margin: var(--spacing-sm) 0 0;
  font-size: 12px;
  color: var(--color-text-tertiary);
}
</style>
