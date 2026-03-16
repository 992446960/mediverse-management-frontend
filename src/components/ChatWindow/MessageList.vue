<template>
  <div class="h-full overflow-hidden flex flex-col">
    <BubbleList
      class="flex-1 overflow-y-auto px-4 py-4"
      :items="bubbleItems"
      :roles="roles"
      auto-scroll
    >
      <template #messageRender="{ content, message }">
        <div class="flex flex-col gap-2">
          <!-- Thinking Process -->
          <ThinkingProcess
            v-if="message.thinking_steps && message.thinking_steps.length > 0"
            :steps="message.thinking_steps"
          />

          <!-- Message Content -->
          <BubbleRenderer :content="content" />

          <!-- Citations -->
          <SourceCitation
            v-if="message.citations && message.citations.length > 0"
            :citations="message.citations"
          />
        </div>
      </template>
    </BubbleList>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BubbleList } from 'ant-design-x-vue'
import { UserOutlined, RobotOutlined } from '@ant-design/icons-vue'
import type { Message } from '@/types/chat'
import BubbleRenderer from './BubbleRenderer.vue'
import ThinkingProcess from './ThinkingProcess.vue'
import SourceCitation from './SourceCitation.vue'

const props = defineProps<{
  messages: Message[]
}>()

const roles = {
  user: {
    placement: 'end',
    avatar: { icon: UserOutlined },
    variant: 'filled', // or 'shadow'
    color: '#1677ff', // Primary color
  },
  assistant: {
    placement: 'start',
    avatar: { icon: RobotOutlined },
    variant: 'filled', // or 'outlined'
    color: '#f0f0f0', // Light gray
  },
  tool: {
    placement: 'start',
    avatar: { icon: RobotOutlined }, // Maybe a different icon
    variant: 'dashed',
  },
}

const bubbleItems = computed(() => {
  return props.messages.map((msg) => ({
    key: msg.id,
    role: msg.role,
    content: msg.content,
    // Pass extra data to be used in slots
    message: msg,
    // Typing effect for streaming messages
    typing: msg.status === 'streaming' ? { step: 2, interval: 50 } : false,
    loading: msg.status === 'sending',
  }))
})
</script>
