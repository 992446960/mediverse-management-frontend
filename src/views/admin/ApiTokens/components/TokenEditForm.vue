<template>
  <a-modal
    :open="open"
    :title="t('apiToken.editToken')"
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
      <a-form-item :label="t('apiToken.name')" name="name">
        <a-input
          v-model:value="formState.name"
          :placeholder="t('apiToken.namePlaceholder')"
          :maxlength="100"
          show-count
        />
      </a-form-item>
      <a-form-item :label="t('common.detail')" name="description">
        <a-textarea
          v-model:value="formState.description"
          :placeholder="t('common.detail')"
          :rows="2"
          :maxlength="500"
          show-count
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { FormInstance } from 'ant-design-vue'
import type { ApiToken } from '@/types/apiTokens'
import type { UpdateApiTokenParams } from '@/types/apiTokens'

const { t } = useI18n()

const props = defineProps<{
  open: boolean
  initialRecord?: ApiToken | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [id: string, values: UpdateApiTokenParams]
}>()

const formRef = ref<FormInstance>()
const confirmLoading = ref(false)

const formState = ref<UpdateApiTokenParams>({
  name: '',
  description: '',
})

const rules = {
  name: [
    { required: true, message: t('apiToken.name') + ' ' + t('common.required'), trigger: 'blur' },
    { max: 100, message: t('common.max100'), trigger: 'blur' },
  ],
}

watch(
  () => [props.open, props.initialRecord] as const,
  ([open, record]) => {
    if (open && record) {
      formState.value = {
        name: record.name,
        description: record.description ?? '',
      }
    }
    formRef.value?.clearValidate()
  },
  { immediate: true }
)

async function handleOk() {
  if (!props.initialRecord?.id) return
  try {
    await formRef.value?.validate()
    confirmLoading.value = true
    emit('submit', props.initialRecord.id, {
      name: formState.value.name?.trim(),
      description: formState.value.description?.trim() || undefined,
    })
  } catch {
    // validation failed
  } finally {
    confirmLoading.value = false
  }
}
</script>
