<template>
  <div class="h-full flex flex-col bg-white dark:bg-gray-900">
    <ChatWindow
      :title="title || '数字医生测试'"
      :messages="messages"
      :loading="loading"
      :streaming="streaming"
      is-test-mode
      welcome-title="分身测试模式"
      welcome-description="在此模式下，您可以直接与当前配置的数字医生分身进行对话测试。"
      input-placeholder="输入测试内容..."
      @send="handleSend"
      @stop="handleStop"
    >
      <template #actions>
        <Button size="small" @click="handleClear">清空对话</Button>
      </template>
    </ChatWindow>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Button, message as antMessage } from 'ant-design-vue'
import ChatWindow from '@/components/ChatWindow/index.vue'
import { useSSEChat } from '@/composables/useSSEChat'
import type { Message } from '@/types/chat'

const props = defineProps<{
  title?: string
  avatarId?: string
}>()
// Use props to avoid unused warning
console.log(props)

const { sendMessage, stopGeneration, streaming, thinkingSteps } = useSSEChat()
const messages = ref<Message[]>([])
const loading = ref(false)

const handleSend = async (content: string, attachments: File[], options: any) => {
  if (streaming.value) return

  // 1. Add user message
  const userMsg: Message = {
    id: `u-${Date.now()}`,
    session_id: 'test-session',
    role: 'user',
    content,
    created_at: new Date().toISOString(),
    status: 'sent',
  }
  messages.value.push(userMsg)

  // 2. Add assistant placeholder
  const assistantMsg = reactive<Message>({
    id: `a-${Date.now()}`,
    session_id: 'test-session',
    role: 'assistant',
    content: '',
    thinking_steps: [],
    created_at: new Date().toISOString(),
    status: 'streaming',
  })
  messages.value.push(assistantMsg)

  // 3. Send request
  try {
    loading.value = true
    // Use a test endpoint or the standard session endpoint with a mock ID
    const url = `/api/v1/sessions/test-session/messages`

    await sendMessage(
      url,
      {
        content,
        avatar_id: props.avatarId,
        ...options,
      },
      {
        onDelta: (delta) => {
          assistantMsg.content += delta
          // Sync thinking steps
          // Note: thinkingSteps is a Ref from useSSEChat, need to copy it
          assistantMsg.thinking_steps = JSON.parse(JSON.stringify(thinkingSteps.value))
        },
        onDone: (msgId) => {
          assistantMsg.id = msgId || assistantMsg.id
          assistantMsg.status = 'sent'
          assistantMsg.thinking_steps = JSON.parse(JSON.stringify(thinkingSteps.value))
          loading.value = false
        },
        onError: (err) => {
          assistantMsg.status = 'error'
          assistantMsg.content += `\n[Error: ${err}]`
          loading.value = false
          antMessage.error('发送失败: ' + err)
        },
      }
    )
  } catch {
    loading.value = false
    assistantMsg.status = 'error'
  }
}

const handleStop = () => {
  stopGeneration()
}

const handleClear = () => {
  messages.value = []
}
</script>
