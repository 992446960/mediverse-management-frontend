<template>
  <div class="thinking-process mb-4 border-l-2 border-blue-200 pl-3">
    <div
      class="flex items-center cursor-pointer text-xs text-gray-500 hover:text-blue-600 transition-colors"
      @click="expanded = !expanded"
    >
      <component :is="expanded ? DownOutlined : RightOutlined" class="mr-1" />
      <span>思考过程 ({{ steps.length }} 步)</span>
      <span v-if="isThinking" class="ml-2 animate-pulse text-blue-400">思考中...</span>
    </div>

    <div v-show="expanded" class="mt-2 space-y-2">
      <div
        v-for="(step, index) in steps"
        :key="index"
        class="text-sm p-2 rounded bg-gray-50 border border-gray-100"
      >
        <div class="flex items-center justify-between mb-1">
          <span class="font-medium text-gray-700">{{ step.title || `步骤 ${index + 1}` }}</span>
          <span class="text-xs text-gray-400">
            <LoadingOutlined v-if="step.status === 'pending'" />
            <CheckCircleOutlined v-else-if="step.status === 'success'" class="text-green-500" />
            <CloseCircleOutlined v-else-if="step.status === 'error'" class="text-red-500" />
            <span v-if="step.duration" class="ml-1">{{ step.duration }}ms</span>
          </span>
        </div>
        <div v-if="step.content" class="text-gray-600 text-xs whitespace-pre-wrap">
          {{ step.content }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  DownOutlined,
  RightOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons-vue'
import type { ThinkingStep } from '@/api/knowledgeSearch'

const props = defineProps<{
  steps: ThinkingStep[]
}>()

const expanded = ref(true)

const isThinking = computed(() => {
  return props.steps.some((step) => step.status === 'pending')
})
</script>
