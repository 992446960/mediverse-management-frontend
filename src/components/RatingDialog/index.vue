<script setup lang="ts">
import { ref, watch } from 'vue'
import { Modal, Rate, Input, Form, FormItem, message } from 'ant-design-vue'
import { useChatStore } from '@/stores/chat'

const props = defineProps<{
  open: boolean
  sessionId: string
}>()

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

    message.success('感谢您的反馈')
    emit('success')
    emit('update:open', false)
  } catch {
    message.error('提交失败')
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
    title="评价本次问诊"
    :confirm-loading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <Form layout="vertical">
      <FormItem label="诊断准确率">
        <Rate v-model:value="formState.accuracy" />
      </FormItem>
      <FormItem label="问诊完成度">
        <Rate v-model:value="formState.completion" />
      </FormItem>
      <FormItem label="其他反馈（可选）">
        <Input.TextArea
          v-model:value="formState.feedback"
          placeholder="请输入您的建议..."
          :rows="4"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
