<template>
  <div class="flex flex-col h-full bg-white dark:bg-gray-900 relative">
    <!-- Header -->
    <div
      v-if="title"
      class="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0"
    >
      <div class="flex items-center gap-2">
        <h2 class="text-lg font-medium m-0">{{ title }}</h2>
        <Tag v-if="isTestMode" color="orange">测试模式</Tag>
      </div>
      <div class="flex items-center gap-2">
        <slot name="actions"></slot>
      </div>
    </div>

    <!-- Message List -->
    <div class="flex-1 overflow-hidden relative">
      <MessageList :messages="messages" />

      <!-- Prompts (Empty State) -->
      <div
        v-if="messages.length === 0 && prompts && prompts.length > 0"
        class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4"
      >
        <div class="pointer-events-auto max-w-2xl w-full">
          <div class="text-center mb-8">
            <h3 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              {{ welcomeTitle || '有什么我可以帮你的吗？' }}
            </h3>
            <p class="text-gray-500 dark:text-gray-400">
              {{ welcomeDescription || '我可以协助您进行诊断、查询知识库或撰写病历。' }}
            </p>
          </div>

          <Prompts :items="prompts" grid @item-click="handlePromptClick" />
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="shrink-0">
      <MessageInput
        :loading="loading"
        :streaming="streaming"
        :disabled="disabled"
        :placeholder="inputPlaceholder"
        @submit="handleSend"
        @stop="handleStop"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Tag } from 'ant-design-vue'
import { Prompts } from 'ant-design-x-vue'
import MessageList from './MessageList.vue'
import MessageInput from './MessageInput.vue'
import type { Message } from '@/types/chat'

const props = defineProps<{
  title?: string
  messages: Message[]
  loading?: boolean
  streaming?: boolean
  disabled?: boolean
  isTestMode?: boolean
  welcomeTitle?: string
  welcomeDescription?: string
  inputPlaceholder?: string
  prompts?: Array<{ key: string; label: string; description?: string; icon?: any }>
}>()

// Use props
console.log(props)

const emit = defineEmits<{
  (e: 'send', content: string, attachments: File[], options: any): void
  (e: 'stop'): void
}>()

const handleSend = (content: string, attachments: File[], options: any) => {
  emit('send', content, attachments, options)
}

const handleStop = () => {
  emit('stop')
}

const handlePromptClick = (item: any) => {
  emit('send', item.label, [], { thinkingMode: 'medium', webSearch: false })
}
</script>
