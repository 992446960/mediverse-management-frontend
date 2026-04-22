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
      <a-form-item name="logo_url">
        <template #label>
          <span class="org-form-logo-label">{{ t('org.logo') }}</span>
        </template>
        <div class="step-info-avatar-wrap flex flex-col gap-2">
          <input
            ref="logoFileRef"
            type="file"
            :accept="LOGO_ACCEPT"
            style="display: none"
            aria-hidden="true"
            @change="onLogoFileChange"
          />
          <div
            class="step-info-upload-card group relative w-20 h-20 rounded-lg bg-gray-50 dark:bg-gray-700 flex flex-col items-center justify-center border border-dashed border-gray-300 dark:border-gray-600 overflow-hidden shrink-0"
            :class="[
              logoPreviewUrl
                ? ''
                : 'cursor-pointer hover:border-[#0ea5e9] hover:text-[#0ea5e9] transition-all',
              logoUploading ? 'pointer-events-none opacity-70' : '',
            ]"
            @click="onLogoCardClick"
          >
            <a-spin v-if="logoUploading" />
            <template v-else-if="logoPreviewUrl">
              <div class="absolute inset-0 w-full h-full" @click.stop>
                <a-image
                  :src="logoDisplayUrl"
                  :alt="t('org.logo')"
                  class="w-full h-full [&_.ant-image]:block! [&_.ant-image-img]:w-full! [&_.ant-image-img]:h-full! [&_.ant-image-img]:object-cover!"
                />
              </div>
            </template>
            <template v-else>
              <PlusOutlined class="text-gray-400 text-lg" />
              <span class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{
                t('org.logoUpload')
              }}</span>
            </template>
          </div>
          <template v-if="logoPreviewUrl">
            <div class="text-left">
              <a-button type="link" size="small" class="p-0 h-auto" @click="triggerLogoFileInput">
                {{ t('common.selectFile') }}
              </a-button>
            </div>
          </template>
          <div class="flex flex-col gap-0.5">
            <p class="text-xs text-gray-400">
              {{ t('org.logoSizeHint') + '，' + t('org.logoUploadHint') }}
            </p>
          </div>
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
const LOGO_ACCEPT_LIST = LOGO_ACCEPT.split(',').map((s) => s.trim())
const LOGO_MAX_SIZE = 2 * 1024 * 1024

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

const formState = ref<OrganizationForm>({
  name: '',
  code: '',
  description: '',
  logo_url: '',
})

const logoPreviewUrl = computed(() =>
  formState.value.logo_url?.trim() ? formState.value.logo_url.trim() : ''
)

const logoDisplayUrl = computed(() =>
  logoPreviewUrl.value ? toAbsoluteFileUrl(logoPreviewUrl.value) : ''
)

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

function triggerLogoFileInput() {
  logoFileRef.value?.click()
}

function onLogoCardClick() {
  if (logoPreviewUrl.value) return
  triggerLogoFileInput()
}

async function onLogoFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const type = file.type
  if (!LOGO_ACCEPT_LIST.includes(type)) {
    message.warning(t('org.logoFormatHint'))
    return
  }
  if (file.size > LOGO_MAX_SIZE) {
    message.warning(t('profile.avatarSizeExceeded'))
    return
  }
  logoUploading.value = true
  try {
    const res = await uploadAvatar(file)
    formState.value = { ...formState.value, logo_url: res.url }
  } catch {
    // 错误由拦截器提示
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
/* 与分身 StepInfo 表单项 label / 上传卡片一致 */
.org-form-logo-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--ant-color-text, #374151);
}
.step-info-upload-card {
  min-width: 80px;
  min-height: 80px;
}
.step-info-upload-card :deep(.ant-image) {
  width: 100%;
  height: 100%;
  display: block;
}
.step-info-upload-card :deep(.ant-image-img) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}
.step-info-upload-card :deep(.ant-image-mask) {
  border-radius: 0.5rem;
}
</style>
