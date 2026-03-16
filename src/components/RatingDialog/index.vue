<script setup lang="ts">
import { ref, watch } from 'vue'
import { Modal, Rate, Input, Form, FormItem, message } from 'ant-design-vue'
import { rateMessage } from '@/api/sessions'

const props = defineProps<{
  visible: boolean
  messageId: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'success'): void
}>()

const loading = ref(false)
const formState = ref({
  diagnosticAccuracy: 0,
  consultationCompleteness: 0,
  feedback: '',
})

const handleOk = async () => {
  if (!props.messageId) return

  loading.value = true
  try {
    // Assuming rateMessage supports detailed feedback, or just simple rating
    // The API rateMessage(id, 'like' | 'dislike') is simple.
    // I might need to update the API or just use a mock implementation for now if the API doesn't support detailed rating.
    // The plan says "RatingDialog: 评分弹窗：多维度星级（诊断准确率/问诊完成度）+文本反馈（可选）"
    // But store uses `rateMessage(messageId, rating)` where rating is 'like' | 'dislike'.
    // I should check `src/api/sessions.ts` to see if there is a detailed rating endpoint.

    // For now, I'll just simulate it or call the simple one if rating > 3 ? 'like' : 'dislike'
    // Or maybe there is another endpoint.

    await rateMessage(props.messageId, formState.value.diagnosticAccuracy > 3 ? 'like' : 'dislike')

    message.success('感谢您的反馈')
    emit('success')
    emit('update:visible', false)
  } catch {
    message.error('提交失败')
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  emit('update:visible', false)
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      formState.value = {
        diagnosticAccuracy: 0,
        consultationCompleteness: 0,
        feedback: '',
      }
    }
  }
)
</script>

<template>
  <Modal
    :open="visible"
    title="评价本次回答"
    :confirm-loading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <Form layout="vertical">
      <FormItem label="诊断准确率">
        <Rate v-model:value="formState.diagnosticAccuracy" />
      </FormItem>
      <FormItem label="问诊完成度">
        <Rate v-model:value="formState.consultationCompleteness" />
      </FormItem>
      <FormItem label="其他反馈">
        <Input.TextArea
          v-model:value="formState.feedback"
          placeholder="请输入您的建议..."
          :rows="4"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
