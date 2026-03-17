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
        <a-upload
          v-model:file-list="logoFileList"
          name="logo"
          list-type="picture-card"
          :max-count="1"
          :accept="LOGO_ACCEPT"
          :show-upload-list="{ showPreviewIcon: true, showRemoveIcon: true }"
          :before-upload="beforeLogoUpload"
          :custom-request="customLogoUpload"
          class="org-logo-upload"
        >
          <template v-if="logoFileList.length < 1">
            <div class="flex flex-col items-center justify-center">
              <PlusOutlined />
              <span class="mt-1 text-xs">{{ t('org.logoUpload') }}</span>
            </div>
          </template>
        </a-upload>
        <p class="mt-1 text-xs text-gray-400">
          {{ t('org.logoUploadHint') }}
        </p>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import type { UploadFile, UploadProps } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import type { FormInstance } from 'ant-design-vue'
import { toAbsoluteFileUrl, uploadAvatar } from '@/api/upload'
import type { Organization, OrganizationForm } from '@/types/organization'
import errorImgUrl from '@/assets/error_img.png'

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
const logoFileList = ref<UploadFile[]>([])

const formState = ref<OrganizationForm>({
  name: '',
  code: '',
  description: '',
  logo_url: '',
})

const rules = {
  name: [
    { required: true, message: t('org.name') + ' ' + t('common.required'), trigger: 'blur' },
    { max: 100, message: t('org.name') + ' ' + t('common.max100'), trigger: 'blur' },
  ],
} as const

function urlToFileItem(url: string, thumbUrl?: string): UploadFile {
  return {
    uid: `logo-${Date.now()}`,
    name: 'logo',
    status: 'done',
    url: toAbsoluteFileUrl(url),
    thumbUrl: thumbUrl ?? toAbsoluteFileUrl(url),
  }
}

function probeImage(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = src
  })
}

watch(
  () => [props.open, props.initialRecord] as const,
  async ([open, record]) => {
    if (open) {
      if (record) {
        const logoUrl = record.logo_url ?? (record as unknown as { logoUrl?: string }).logoUrl ?? ''
        formState.value = {
          name: record.name,
          code: record.code ?? '',
          description: record.description ?? '',
          logo_url: logoUrl,
        }
        if (logoUrl) {
          const absoluteUrl = toAbsoluteFileUrl(logoUrl)
          const loaded = await probeImage(absoluteUrl)
          logoFileList.value = [urlToFileItem(logoUrl, loaded ? undefined : errorImgUrl)]
        } else {
          logoFileList.value = []
        }
      } else {
        formState.value = { name: '', code: '', description: '', logo_url: '' }
        logoFileList.value = []
      }
      formRef.value?.clearValidate()
    }
  },
  { immediate: true }
)

watch(
  logoFileList,
  (list) => {
    const done = list.find((f) => f.status === 'done')
    const url = (done?.response as { url?: string })?.url ?? done?.url ?? ''
    formState.value.logo_url = url
  },
  { deep: true }
)

const beforeLogoUpload: UploadProps['beforeUpload'] = (file) => {
  const type = file.type
  if (!LOGO_ACCEPT_LIST.includes(type)) {
    message.warning(t('org.logoFormatHint'))
    return false
  }
  if (file.size > LOGO_MAX_SIZE) {
    message.warning(t('profile.avatarSizeExceeded'))
    return false
  }
  return true
}

const customLogoUpload: NonNullable<UploadProps['customRequest']> = async (options) => {
  const { file, onSuccess, onError } = options
  try {
    const res = await uploadAvatar(file as File)
    onSuccess?.({ url: res.url })
  } catch (err) {
    onError?.(err as Error)
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
.org-logo-upload :deep(.ant-upload-select) {
  width: 104px;
  height: 104px;
}
.org-logo-upload :deep(.ant-upload-list-item) {
  width: 104px;
  height: 104px;
  padding: 0 !important;
  overflow: hidden !important;
}
.org-logo-upload :deep(.ant-upload-list-item):after {
  width: 100%;
  height: 100%;
}
</style>
