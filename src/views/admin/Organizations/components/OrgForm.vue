<template>
  <a-modal
    :open="open"
    :title="isEdit ? t('org.editOrg') : t('org.addOrg')"
    :confirm-loading="confirmLoading"
    @ok="handleOk"
    @cancel="emit('update:open', false)"
  >
    <a-form
      ref="formRef"
      :model="formState"
      :rules="rules"
      layout="vertical"
      @submit.prevent="handleOk"
    >
      <a-form-item :label="t('org.name')" name="name">
        <a-input
          v-model:value="formState.name"
          :placeholder="t('org.name')"
          :maxlength="100"
          show-count
        />
      </a-form-item>
      <a-form-item :label="t('org.code')" name="code">
        <a-input v-model:value="formState.code" :placeholder="t('org.code')" />
      </a-form-item>
      <a-form-item :label="t('org.description')" name="description">
        <a-textarea
          v-model:value="formState.description"
          :placeholder="t('org.description')"
          :rows="3"
        />
      </a-form-item>
      <a-form-item :label="t('org.logo')" name="logo_url">
        <div class="org-logo-upload-wrap flex flex-col gap-2">
          <input
            ref="logoFileRef"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style="display: none"
            aria-hidden="true"
            @change="onLogoFileChange"
          />
          <div
            class="org-logo-upload-card group relative w-20 h-20 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col items-center justify-center border border-dashed border-gray-300 dark:border-gray-600 overflow-hidden shrink-0"
            :class="[
              formState.logo_url && !logoImageError
                ? ''
                : 'cursor-pointer hover:border-primary hover:text-primary transition-all',
              logoUploading ? 'pointer-events-none opacity-70' : '',
            ]"
            @click="onLogoCardClick"
          >
            <a-spin v-if="logoUploading" />
            <template v-else-if="formState.logo_url && !logoImageError">
              <div class="absolute inset-0 w-full h-full" @click.stop>
                <a-image
                  :src="logoDisplayUrl"
                  :alt="t('org.logo')"
                  class="org-logo-a-image w-full h-full [&_.ant-image]:block! [&_.ant-image-img]:w-full! [&_.ant-image-img]:h-full! [&_.ant-image-img]:object-cover!"
                  @error="onLogoImageError"
                />
              </div>
            </template>
            <template v-else>
              <PlusOutlined class="text-gray-400 text-lg" />
              <span class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{
                logoImageError ? t('org.logoLoadFailed') : t('org.logoUpload')
              }}</span>
            </template>
          </div>
          <template v-if="formState.logo_url && !logoImageError">
            <div class="text-left">
              <a-button type="link" size="small" class="p-0 h-auto" @click="triggerLogoFileInput">
                {{ t('common.selectFile') }}
              </a-button>
            </div>
          </template>
          <p class="text-xs text-gray-400">
            {{ t('org.logoUploadHint') }}
          </p>
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import type { FormInstance } from 'ant-design-vue'
import { toAbsoluteFileUrl, uploadAvatar } from '@/api/upload'
import type { Organization, OrganizationForm } from '@/types/organization'

const LOGO_ACCEPT = 'image/jpeg,image/png,image/webp'

const { t } = useI18n()

interface Props {
  open: boolean
  initialRecord?: Organization | null
}

const props = withDefaults(defineProps<Props>(), {
  initialRecord: null,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [values: OrganizationForm]
}>()

const isEdit = computed(() => !!props.initialRecord?.id)

const formRef = ref<FormInstance>()
const confirmLoading = ref(false)
const logoFileRef = ref<HTMLInputElement | null>(null)
const logoUploading = ref(false)
const logoImageError = ref(false)

const formState = ref<OrganizationForm>({
  name: '',
  code: '',
  description: '',
  logo_url: '',
})

/** 用于 img 回显：将相对 path 转为完整地址，避免跨域/同源 404 */
const logoDisplayUrl = computed(() => toAbsoluteFileUrl(formState.value.logo_url || ''))

const rules = {
  name: [
    { required: true, message: t('org.name') + ' ' + t('common.required'), trigger: 'blur' },
    { max: 100, message: t('org.name') + ' ' + t('common.max100'), trigger: 'blur' },
  ],
} as const

watch(
  () => [props.open, props.initialRecord] as const,
  ([open, record]) => {
    if (open) {
      logoImageError.value = false
      if (record) {
        const logoUrl = record.logo_url ?? (record as unknown as { logoUrl?: string }).logoUrl ?? ''
        formState.value = {
          name: record.name,
          code: record.code ?? '',
          description: record.description ?? '',
          logo_url: logoUrl,
        }
      } else {
        formState.value = { name: '', code: '', description: '', logo_url: '' }
      }
      formRef.value?.clearValidate()
    }
  },
  { immediate: true }
)

watch(
  () => formState.value.logo_url,
  () => {
    logoImageError.value = false
  }
)

function onLogoImageError() {
  logoImageError.value = true
}

function triggerLogoFileInput() {
  logoFileRef.value?.click()
}

function onLogoCardClick() {
  if (formState.value.logo_url && !logoImageError.value) return
  triggerLogoFileInput()
}

async function onLogoFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const type = file.type
  if (
    !LOGO_ACCEPT.split(',')
      .map((s) => s.trim())
      .includes(type)
  ) {
    message.warning(t('org.logoFormatHint'))
    return
  }
  logoUploading.value = true
  try {
    const res = await uploadAvatar(file)
    logoImageError.value = false
    formState.value = { ...formState.value, logo_url: res.url }
  } finally {
    logoUploading.value = false
  }
}

async function handleOk() {
  try {
    await formRef.value?.validate()
    confirmLoading.value = true
    const values: OrganizationForm = {
      name: formState.value.name.trim(),
      code: formState.value.code?.trim() || undefined,
      description: formState.value.description?.trim() || undefined,
      logo_url: formState.value.logo_url?.trim() || undefined,
    }
    emit('submit', values)
    emit('update:open', false)
  } catch {
    // validation failed
  } finally {
    confirmLoading.value = false
  }
}
</script>

<style scoped>
.org-logo-upload-card {
  min-width: 80px;
  min-height: 80px;
}

/* 机构 logo 使用 a-image 时填满卡片 */
.org-logo-upload-card :deep(.ant-image) {
  width: 100%;
  height: 100%;
  display: block;
}
.org-logo-upload-card :deep(.ant-image-img) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}
</style>
