<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { Prompts } from 'ant-design-x-vue'
import { BulbOutlined, RocketOutlined, SmileOutlined } from '@ant-design/icons-vue'
import MessageList from './MessageList.vue'
import MessageInput from './MessageInput.vue'
import { useChatStore } from '@/stores/chat'

const props = defineProps<{
  sessionId?: string
  isTestMode?: boolean
  avatarId?: string
}>()

const chatStore = useChatStore()
const { messages, currentSessionId, loadingMessages } = storeToRefs(chatStore)
const { sendMessage, stopGeneration, selectSession, createNewSession } = chatStore

const currentMessages = computed(() => {
  const id = props.sessionId || currentSessionId.value
  return id ? messages.value[id] || [] : []
})

const isStreaming = computed(() => {
  const lastMsg = currentMessages.value[currentMessages.value.length - 1]
  return lastMsg?.status === 'streaming'
})

const initialPrompts = [
  { key: '1', label: '帮我分析这个病例', icon: BulbOutlined },
  { key: '2', label: '推荐最新的高血压诊疗指南', icon: RocketOutlined },
  { key: '3', label: '如何处理医患纠纷？', icon: SmileOutlined },
]

const handleSend = async (content: string) => {
  if (!props.sessionId && !currentSessionId.value) {
    // Create new session first if needed
    await createNewSession(content.slice(0, 20), props.avatarId)
    // Wait for session creation then send
  }

  await sendMessage(content)
}

const handlePromptClick = (prompt: { label: string }) => {
  handleSend(prompt.label)
}

onMounted(async () => {
  if (props.sessionId) {
    await selectSession(props.sessionId)
  }
})

watch(
  () => props.sessionId,
  async (newId) => {
    if (newId) {
      await selectSession(newId)
    }
  }
)
</script>

<template>
  <div class="chat-window flex flex-col h-full bg-white dark:bg-gray-900">
    <!-- Header (Optional, maybe handled by layout) -->

    <!-- Messages Area -->
    <div class="flex-1 overflow-hidden relative">
      <MessageList
        v-if="currentMessages.length > 0"
        :messages="currentMessages"
        :loading="loadingMessages"
      />

      <!-- Empty State / Prompts -->
      <div v-else class="h-full flex flex-col items-center justify-center p-8 text-center">
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Mediverse Digital Doctor
          </h2>
          <p class="text-gray-500 dark:text-gray-400">您的智能医疗助手，随时为您提供专业支持</p>
        </div>

        <Prompts
          :items="initialPrompts"
          title="您可以试着问我："
          class="max-w-md w-full"
          @item-click="handlePromptClick"
        />
      </div>
    </div>

    <!-- Input Area -->
    <MessageInput :loading="isStreaming" @send="handleSend" @stop="stopGeneration" />
  </div>
</template>

<style scoped>
.chat-window {
  /* Ensure it takes full height of container */
  height: 100%;
}
</style>
