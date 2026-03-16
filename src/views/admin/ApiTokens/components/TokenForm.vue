<template>
  <a-modal
    :open="open"
    :title="t('apiToken.addToken')"
    :confirm-loading="confirmLoading"
    :footer="createdResult ? null : undefined"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <template v-if="!createdResult">
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
        <a-form-item v-if="!lockOrgToCurrent" :label="t('apiToken.org')" name="org_id">
          <a-select
            v-model:value="formState.org_id"
            :placeholder="t('apiToken.org')"
            :options="orgOptions"
            allow-clear
            show-search
            :filter-option="filterOrgOption"
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
    </template>
    <template v-else>
      <a-alert type="warning" :message="t('apiToken.tokenVisibleTip')" show-icon class="mb-4" />
      <div class="flex items-center gap-2 flex-wrap my-4">
        <a-input :value="createdResult.plain_token" readonly class="flex-1 min-w-200 font-mono" />
        <a-button type="primary" @click="copyToken">
          {{ t('apiToken.copy') }}
        </a-button>
      </div>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import type { ApiTokenCreateResult, CreateApiTokenParams } from '@/types/apiTokens'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    open: boolean
    orgOptions: Array<{ label: string; value: string }>
    /** 机构/科室管理员时锁定为当前机构，隐藏机构选择 */
    lockOrgToCurrent?: boolean
    /** 锁定机构时的默认机构 ID */
    defaultOrgId?: string
  }>(),
  { orgOptions: () => [], lockOrgToCurrent: false, defaultOrgId: '' }
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [values: CreateApiTokenParams]
  created: [result: ApiTokenCreateResult]
}>()

const formRef = ref<FormInstance>()
const confirmLoading = ref(false)
const createdResult = ref<ApiTokenCreateResult | null>(null)

const formState = ref<CreateApiTokenParams>({
  org_id: '',
  name: '',
  description: '',
})

const rules = computed(() => ({
  name: [
    { required: true, message: t('apiToken.name') + ' ' + t('common.required'), trigger: 'blur' },
    { max: 100, message: t('common.max100'), trigger: 'blur' },
  ],
  ...(props.lockOrgToCurrent
    ? {}
    : {
        org_id: [
          {
            required: true,
            message: t('apiToken.org') + ' ' + t('common.required'),
            trigger: 'change',
          },
        ],
      }),
}))

function filterOrgOption(input: string, option: { label?: string; value?: string }) {
  return (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      createdResult.value = null
      formState.value = {
        org_id: props.lockOrgToCurrent ? props.defaultOrgId || '' : '',
        name: '',
        description: '',
      }
    }
    formRef.value?.clearValidate()
  }
)

async function handleOk() {
  try {
    await formRef.value?.validate()
    confirmLoading.value = true
    const values: CreateApiTokenParams = {
      org_id: props.lockOrgToCurrent
        ? props.defaultOrgId || formState.value.org_id
        : formState.value.org_id,
      name: formState.value.name.trim(),
      description: formState.value.description?.trim() || undefined,
    }
    emit('submit', values)
    // 注意：submit 后由父组件调用 createApiToken，成功后通过 created 回调传入 result，这里不关弹窗
  } catch {
    // validation failed
  } finally {
    confirmLoading.value = false
  }
}

function handleCancel() {
  createdResult.value = null
  emit('update:open', false)
}

/** 父组件在创建成功后调用，用于展示 plain_token */
function showCreatedResult(result: ApiTokenCreateResult) {
  createdResult.value = result
}

async function copyToken() {
  if (!createdResult.value?.plain_token) return
  try {
    await navigator.clipboard.writeText(createdResult.value.plain_token)
    message.success(t('apiToken.copySuccess'))
  } catch {
    message.error(t('apiToken.copyFailed'))
  }
}

defineExpose({
  showCreatedResult,
  resetForm: () => {
    createdResult.value = null
    formState.value = {
      org_id: props.lockOrgToCurrent ? props.defaultOrgId || '' : '',
      name: '',
      description: '',
    }
  },
})
</script>
