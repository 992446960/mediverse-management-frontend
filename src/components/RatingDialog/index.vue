<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Modal, Rate, message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { useChatStore } from '@/stores/chat'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    open: boolean
    sessionId: string
    hasRated?: boolean
  }>(),
  { hasRated: false }
)

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'success'): void
}>()

const chatStore = useChatStore()
const loading = ref(false)
const formRef = ref<FormInstance>()

const formState = ref({
  accuracy: 0,
  completion: 0,
  feedback: '',
})

const rateRequiredRule = (fieldKey: 'accuracy' | 'completion') => ({
  required: true,
  validator: (_rule: unknown, value: number) => {
    if (value === 0 || value === undefined || value === null) {
      return Promise.reject(new Error(t('rating.' + fieldKey) + ' ' + t('common.required')))
    }
    return Promise.resolve()
  },
  trigger: 'change',
})

const rules = {
  accuracy: [rateRequiredRule('accuracy')],
  completion: [rateRequiredRule('completion')],
}

const handleOk = async () => {
  if (!props.sessionId) return

  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  loading.value = true
  try {
    await chatStore.submitRating(props.sessionId, {
      scores: {
        accuracy: formState.value.accuracy,
        completion: formState.value.completion,
      },
      feedback_text: formState.value.feedback || undefined,
    })

    message.success(t('rating.submitSuccess'))
    emit('success')
    emit('update:open', false)
  } catch {
    message.error(t('rating.submitFailed'))
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  emit('update:open', false)
}

watch(
  () => props.open,
  (val) => {
    if (val) {
      formState.value = { accuracy: 0, completion: 0, feedback: '' }
      formRef.value?.clearValidate()
    }
  }
)
</script>

<template>
  <Modal
    :open="open"
    :title="t('rating.title')"
    :confirm-loading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-alert v-if="hasRated" type="info" :message="t('rating.reSubmitHint')" show-icon />
    <a-form ref="formRef" :model="formState" :rules="rules" layout="vertical">
      <a-form-item :label="t('rating.accuracy')" name="accuracy">
        <Rate v-model:value="formState.accuracy" />
      </a-form-item>
      <a-form-item :label="t('rating.completion')" name="completion">
        <Rate v-model:value="formState.completion" />
      </a-form-item>
      <a-form-item :label="t('rating.feedback')" name="feedback">
        <a-textarea
          v-model:value="formState.feedback"
          :placeholder="t('rating.feedbackPlaceholder')"
          :rows="4"
        />
      </a-form-item>
    </a-form>
  </Modal>
</template>
