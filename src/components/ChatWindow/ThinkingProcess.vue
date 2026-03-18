<script setup lang="ts">
import { computed } from 'vue'
import { ThoughtChain } from 'ant-design-x-vue'
import type { ThinkingProcessStep } from '@/types/chat'

const props = defineProps<{
  steps: ThinkingProcessStep[]
}>()

const items = computed(() => {
  return props.steps.map((step) => {
    let extra: string | undefined
    if (step.duration_ms !== undefined) {
      extra = `${step.duration_ms}ms`
    } else if (step.duration) {
      extra = step.duration
    }

    return {
      title: step.title,
      description: step.description,
      status: step.status === 'processing' ? 'pending' : 'success',
      extra,
    }
  })
})
</script>

<template>
  <div class="thinking-process mb-4">
    <ThoughtChain :items="items" collapsible />
  </div>
</template>
