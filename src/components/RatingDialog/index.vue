<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Modal, Rate, Input, Form, FormItem, message } from 'ant-design-vue'
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

const formState = ref({
  accuracy: 0,
  completion: 0,
  feedback: '',
})

const handleOk = async () => {
  if (!props.sessionId) return

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
    <a-alert
      v-if="hasRated"
      type="info"
      :message="t('rating.reSubmitHint')"
      show-icon
      class="mb-4"
    />
    <Form layout="vertical">
      <FormItem :label="t('rating.accuracy')">
        <Rate v-model:value="formState.accuracy" />
      </FormItem>
      <FormItem :label="t('rating.completion')">
        <Rate v-model:value="formState.completion" />
      </FormItem>
      <FormItem :label="t('rating.feedback')">
        <Input.TextArea
          v-model:value="formState.feedback"
          :placeholder="t('rating.feedbackPlaceholder')"
          :rows="4"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
