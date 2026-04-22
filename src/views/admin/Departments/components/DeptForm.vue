<template>
  <a-modal
    :open="open"
    :title="isEdit ? t('dept.editDept') : t('dept.addDept')"
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
      <a-form-item v-if="!isEdit" :label="t('dept.branch')">
        <a-input :value="defaultOrgName" disabled />
      </a-form-item>
      <a-form-item :label="t('dept.name')" name="name">
        <a-input
          v-model:value="formState.name"
          :placeholder="t('dept.namePlaceholder')"
          :maxlength="100"
          show-count
        />
      </a-form-item>
      <a-form-item :label="t('dept.code')" name="code">
        <a-input v-model:value="formState.code" :placeholder="t('dept.code')" />
      </a-form-item>
      <a-form-item :label="t('dept.description')" name="description">
        <a-textarea
          v-model:value="formState.description"
          :placeholder="t('dept.description')"
          :rows="3"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { FormInstance } from 'ant-design-vue'
import type { Department, DepartmentForm } from '@/types/department'

const { t } = useI18n()

interface Props {
  open: boolean
  initialRecord?: Department | null
  defaultOrgId?: string
  defaultOrgName?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialRecord: null,
  defaultOrgId: '',
  defaultOrgName: '',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [values: DepartmentForm]
}>()

const isEdit = computed(() => !!props.initialRecord?.id)

const formRef = ref<FormInstance>()
const confirmLoading = ref(false)

const formState = ref<DepartmentForm>({
  org_id: '',
  name: '',
  code: '',
  description: '',
})

const rules = {
  name: [
    { required: true, message: t('dept.name') + ' ' + t('common.required'), trigger: 'blur' },
    { max: 100, message: t('dept.name') + ' ' + t('common.max100'), trigger: 'blur' },
  ],
} as const

watch(
  () => [props.open, props.initialRecord, props.defaultOrgId] as const,
  ([open, record, defaultOrgId]) => {
    if (open) {
      if (record) {
        formState.value = {
          org_id: record.org_id,
          name: record.name,
          code: record.code ?? '',
          description: record.description ?? '',
        }
      } else {
        formState.value = {
          org_id: defaultOrgId ?? '',
          name: '',
          code: '',
          description: '',
        }
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
    const values: DepartmentForm = {
      org_id: formState.value.org_id,
      name: formState.value.name.trim(),
      code: formState.value.code?.trim() || undefined,
      description: formState.value.description?.trim() || undefined,
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
