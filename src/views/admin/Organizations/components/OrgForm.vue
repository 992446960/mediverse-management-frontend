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
        <a-input v-model:value="formState.name" :placeholder="t('org.name')" :maxlength="100" show-count />
      </a-form-item>
      <a-form-item :label="t('org.code')" name="code">
        <a-input v-model:value="formState.code" :placeholder="t('org.code')" />
      </a-form-item>
      <a-form-item :label="t('org.description')" name="description">
        <a-textarea v-model:value="formState.description" :placeholder="t('org.description')" :rows="3" />
      </a-form-item>
      <a-form-item :label="t('org.logo')" name="logo_url">
        <a-input v-model:value="formState.logo_url" placeholder="https://..." />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormInstance } from 'ant-design-vue'
import type { Organization, OrganizationForm } from '@/types/organization'

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

watch(
  () => [props.open, props.initialRecord] as const,
  ([open, record]) => {
    if (open) {
      if (record) {
        formState.value = {
          name: record.name,
          code: record.code ?? '',
          description: record.description ?? '',
          logo_url: record.logo_url ?? '',
        }
      }
      else {
        formState.value = { name: '', code: '', description: '', logo_url: '' }
      }
      formRef.value?.clearValidate()
    }
  },
  { immediate: true }
)

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
  }
  catch {
    // validation failed
  }
  finally {
    confirmLoading.value = false
  }
}
</script>
