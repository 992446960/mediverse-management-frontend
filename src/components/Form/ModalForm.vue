<template>
  <a-modal
    :open="open"
    :title="title"
    :confirm-loading="confirmLoading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form
      ref="formRef"
      :model="formState"
      :rules="mergedRules"
      layout="vertical"
      @submit.prevent="handleOk"
    >
      <template v-for="item in visibleFormItems" :key="item.name">
        <a-form-item v-if="item.type === 'input'" :label="item.label" :name="item.name">
          <a-input
            v-model:value="formState[item.name]"
            :placeholder="item.placeholder"
            :disabled="item.disabled"
            :maxlength="item.maxlength"
            :show-count="item.maxlength != null"
          />
        </a-form-item>
        <a-form-item v-else-if="item.type === 'textarea'" :label="item.label" :name="item.name">
          <a-textarea
            v-model:value="formState[item.name]"
            :placeholder="item.placeholder"
            :disabled="item.disabled"
            :rows="item.rows ?? 3"
            :maxlength="item.maxlength"
            :show-count="item.maxlength != null"
          />
        </a-form-item>
        <a-form-item v-else-if="item.type === 'number'" :label="item.label" :name="item.name">
          <a-input-number
            v-model:value="formState[item.name]"
            :placeholder="item.placeholder"
            :disabled="item.disabled"
            class="w-full"
          />
        </a-form-item>
        <a-form-item v-else-if="item.type === 'select'" :label="item.label" :name="item.name">
          <a-select
            v-model:value="formState[item.name]"
            :placeholder="item.placeholder"
            :disabled="item.disabled"
            :options="item.options"
            :show-search="item.showSearch"
            :mode="item.mode"
            allow-clear
            class="w-full"
          />
        </a-form-item>
      </template>
      <!-- 额外表单项插槽 -->
      <slot name="extraFields" />
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { FormInstance } from 'ant-design-vue'
import type { ModalFormItemConfig } from './types'

interface ModalFormProps {
  open: boolean
  title: string
  /** 初始值，打开时回填；编辑时传入记录字段映射 */
  initialValues?: Record<string, unknown>
  /** 表单项配置（≥3 项时建议用配置驱动） */
  formItems: ModalFormItemConfig[]
  /** 提交中状态，由父组件控制 */
  confirmLoading?: boolean
}

const props = withDefaults(defineProps<ModalFormProps>(), {
  initialValues: () => ({}),
  confirmLoading: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [values: Record<string, unknown>]
}>()

const formRef = ref<FormInstance>()
const formState = ref<Record<string, unknown>>({})

const visibleFormItems = computed(() =>
  props.formItems.filter(item => !item.hidden),
)

const mergedRules = computed(() => {
  const rules: Record<string, unknown[]> = {}
  for (const item of props.formItems) {
    if (item.rules?.length)
      rules[item.name] = item.rules
  }
  return rules
})

watch(
  () => props.open,
  (open) => {
    if (open) {
      const initial = props.initialValues ?? {}
      const next: Record<string, unknown> = {}
      for (const item of props.formItems) {
        next[item.name] = initial[item.name] ?? (item.type === 'number' ? undefined : '')
      }
      formState.value = next
      formRef.value?.clearValidate()
    }
  },
  { immediate: true },
)

function handleCancel() {
  emit('update:open', false)
}

async function handleOk() {
  try {
    await formRef.value?.validate()
    const values: Record<string, unknown> = {}
    for (const key of Object.keys(formState.value)) {
      const v = formState.value[key]
      if (v !== '' && v !== undefined && v !== null)
        values[key] = v
    }
    emit('submit', values)
    emit('update:open', false)
  }
  catch {
    // 校验未通过，不关闭
  }
}
</script>
