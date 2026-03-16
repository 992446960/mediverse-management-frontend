<template>
  <div class="h-full flex flex-col">
    <ChatWindow
      :title="currentSession?.title || 'Loading...'"
      :messages="messages[currentSessionId || ''] || []"
      :loading="loadingMessages"
      :streaming="streaming"
      @send="handleSend"
      @stop="handleStop"
    />

    <RatingDialog
      v-model:open="showRating"
      :loading="submittingRating"
      :message-id="ratingMessageId"
      @submit="handleSubmitRating"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { message } from 'ant-design-vue'
import ChatWindow from '@/components/ChatWindow/index.vue'
import RatingDialog from '@/components/RatingDialog/index.vue'
import { useChatStore } from '@/stores/chat'
import { rateMessage } from '@/api/sessions'

const route = useRoute()
const chatStore = useChatStore()
const { currentSession, currentSessionId, messages, loadingMessages, streaming } =
  storeToRefs(chatStore)

const showRating = ref(false)
const ratingMessageId = ref('')
const submittingRating = ref(false)

onMounted(() => {
  const id = route.params.id as string
  if (id) {
    chatStore.selectSession(id)
  }
})

watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      chatStore.selectSession(newId as string)
    }
  }
)

const handleSend = async (content: string, attachments: File[]) => {
  await chatStore.sendMessage(content, attachments)
}

const handleStop = () => {
  chatStore.stopGeneration()
}

const handleSubmitRating = async (data: any) => {
  try {
    submittingRating.value = true
    // Calculate average or use specific logic
    const avgRating =
      Object.values(data.ratings).reduce((a: number, b: number) => a + b, 0) /
      Object.keys(data.ratings).length
    await rateMessage(data.messageId, avgRating)
    message.success('评价提交成功')
    showRating.value = false
  } catch {
    message.error('评价提交失败')
  } finally {
    submittingRating.value = false
  }
}
</script>
