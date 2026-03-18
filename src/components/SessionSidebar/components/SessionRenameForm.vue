<template>
  <a-modal
    :open="open"
    :title="t('chat.renameSessionTitle')"
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
      <a-form-item :label="t('chat.renameSessionName')" name="title">
        <a-input
          v-model:value="formState.title"
          :placeholder="t('chat.renamePlaceholder')"
          :maxlength="50"
          show-count
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import type { FormInstance } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'

interface Props {
  open: boolean
  initialTitle?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  initialTitle: '',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [title: string]
}>()

const { t } = useI18n()

const formRef = ref<FormInstance | null>(null)
const confirmLoading = ref(false)
const formState = ref({
  title: '',
})

const rules = computed(() => ({
  title: [
    {
      required: true,
      whitespace: true,
      message: t('chat.renameRequired'),
      trigger: 'blur',
    },
    {
      max: 50,
      message: t('common.max50'),
      trigger: 'blur',
    },
  ],
}))

watch(
  () => [props.open, props.initialTitle] as const,
  ([open, initialTitle]) => {
    if (open) {
      formState.value.title = initialTitle ?? ''
      formRef.value?.clearValidate()
    }
  },
  { immediate: true }
)

async function handleOk() {
  try {
    await formRef.value?.validate()
    confirmLoading.value = true
    emit('submit', formState.value.title.trim())
    emit('update:open', false)
  } catch {
    // validation failed
  } finally {
    confirmLoading.value = false
  }
}
</script>
