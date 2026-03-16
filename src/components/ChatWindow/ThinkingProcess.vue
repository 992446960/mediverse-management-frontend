<script setup lang="ts">
import { computed } from 'vue'
import { ThoughtChain } from 'ant-design-x-vue'
import type { ThinkingStep } from '@/types/chat'

const props = defineProps<{
  steps: ThinkingStep[]
}>()

const items = computed(() => {
  return props.steps.map((step) => ({
    title: step.title,
    description: step.content,
    status: step.status === 'thinking' ? 'pending' : 'success', // Map to Ant Design X status
    // Add other properties if needed
  }))
})
</script>

<template>
  <div class="thinking-process mb-4">
    <ThoughtChain :items="items" collapsible />
  </div>
</template>
