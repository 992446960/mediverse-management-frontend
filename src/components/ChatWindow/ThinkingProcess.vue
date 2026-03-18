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
    description: step.description ?? step.content,
    status: step.status === 'processing' ? 'pending' : 'success',
    extra: step.duration_ms ? `${step.duration_ms}ms` : undefined,
  }))
})
</script>

<template>
  <div class="thinking-process mb-4">
    <ThoughtChain :items="items" collapsible />
  </div>
</template>
