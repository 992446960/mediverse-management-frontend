<template>
  <div v-if="steps.length > 0" class="mb-4">
    <ThoughtChain :items="thoughtItems" collapsible title="思考过程" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ThoughtChain } from 'ant-design-x-vue'
import type { ThinkingStep } from '@/types/chat'

const props = defineProps<{
  steps: ThinkingStep[]
}>()

const thoughtItems = computed(() => {
  return props.steps.map((step) => ({
    title: step.title,
    content: step.content,
    status: mapStatus(step.status),
  }))
})

function mapStatus(status: string) {
  switch (status) {
    case 'thinking':
      return 'pending'
    case 'done':
      return 'success'
    case 'error':
      return 'error'
    default:
      return 'pending'
  }
}
</script>
