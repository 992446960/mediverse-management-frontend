<script setup lang="ts">
import { h, computed } from 'vue'
import { BubbleList, Bubble } from 'ant-design-x-vue'
import BubbleRenderer from './BubbleRenderer.vue'
import ThinkingProcess from './ThinkingProcess.vue'
import SourceCitation from './SourceCitation.vue'
import SkillCallDisplay from './SkillCallDisplay.vue'
import type { Message } from '@/types/chat'
import { getMessageText } from '@/types/chat'
import { UserOutlined, RobotOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  messages: Message[]
  loading?: boolean
}>()

const items = computed(() => {
  return props.messages.map((msg) => ({
    key: msg.id,
    role: msg.role,
    content: getMessageText(msg),
    thinking_process: msg.thinking_process,
    tool_calls: msg.tool_calls,
    citations: msg.citations,
    status: msg.status,
    loading: msg.status === 'streaming',
    avatar: msg.role === 'user' ? { icon: h(UserOutlined) } : { icon: h(RobotOutlined) },
  }))
})

const roles = {
  user: {
    placement: 'end',
    variant: 'shadow',
    avatar: { icon: h(UserOutlined), style: { backgroundColor: '#87d068' } },
  },
  assistant: {
    placement: 'start',
    variant: 'outlined',
    avatar: { icon: h(RobotOutlined), style: { backgroundColor: '#1890ff' } },
    typing: { step: 5, interval: 20 },
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
                v-if="item.thinking_process && item.thinking_process.length > 0"
                :steps="item.thinking_process"
              />

              <!-- Skill Call Display (tool_calls, 仅历史消息) -->
              <SkillCallDisplay
                v-if="item.tool_calls && item.tool_calls.length > 0 && !item.loading"
                :tool-calls="item.tool_calls"
              />

              <!-- Content -->
              <BubbleRenderer :content="content" />

              <!-- Citations (仅历史消息) -->
              <SourceCitation
                v-if="item.citations && item.citations.length > 0 && !item.loading"
                :citations="item.citations"
              />
            </div>
          </template>

          <template v-if="item.role === 'assistant' && !item.loading" #actions>
            <div class="flex gap-2 text-gray-400 text-xs mt-1" />
          </template>
        </Bubble>
      </template>
    </BubbleList>
  </div>
</template>
