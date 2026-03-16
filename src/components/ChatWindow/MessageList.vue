<script setup lang="ts">
import { computed } from 'vue'
import { BubbleList, Bubble } from 'ant-design-x-vue'
import BubbleRenderer from './BubbleRenderer.vue'
import ThinkingProcess from './ThinkingProcess.vue'
import SourceCitation from './SourceCitation.vue'
import type { Message } from '@/types/chat'
import { UserOutlined, RobotOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  messages: Message[]
  loading?: boolean
}>()

const items = computed(() => {
  return props.messages.map((msg) => ({
    key: msg.id,
    role: msg.role,
    content: msg.content,
    thinking_steps: msg.thinking_steps,
    citations: msg.citations,
    status: msg.status,
    loading: msg.status === 'streaming',
    avatar: msg.role === 'user' ? { icon: UserOutlined } : { icon: RobotOutlined },
  }))
})

const roles = {
  user: {
    placement: 'end',
    variant: 'shadow',
    avatar: { icon: UserOutlined, style: { backgroundColor: '#87d068' } },
  },
  assistant: {
    placement: 'start',
    variant: 'outlined',
    avatar: { icon: RobotOutlined, style: { backgroundColor: '#1890ff' } },
    typing: { step: 5, interval: 20 }, // Typing effect configuration
  },
}
</script>

<template>
  <div class="message-list h-full overflow-y-auto p-4">
    <BubbleList :items="items" :roles="roles" :auto-scroll="true">
      <template #item="{ item }">
        <Bubble
          :content="item.content"
          :loading="item.loading"
          :variant="item.role === 'user' ? 'shadow' : 'outlined'"
          :placement="item.role === 'user' ? 'end' : 'start'"
          :avatar="item.avatar"
        >
          <template #messageRender="{ content }">
            <div class="flex flex-col gap-2">
              <!-- Thinking Process -->
              <ThinkingProcess
                v-if="item.thinking_steps && item.thinking_steps.length > 0"
                :steps="item.thinking_steps"
              />

              <!-- Content -->
              <BubbleRenderer :content="content" />

              <!-- Citations -->
              <SourceCitation
                v-if="item.citations && item.citations.length > 0"
                :citations="item.citations"
              />
            </div>
          </template>

          <!-- Actions (Rating, etc.) -->
          <template v-if="item.role === 'assistant' && !item.loading" #actions>
            <div class="flex gap-2 text-gray-400 text-xs mt-1">
              <!-- Add rating actions here -->
            </div>
          </template>
        </Bubble>
      </template>
    </BubbleList>
  </div>
</template>

<style scoped>
.message-list {
  /* Custom scrollbar styling if needed */
}
</style>
