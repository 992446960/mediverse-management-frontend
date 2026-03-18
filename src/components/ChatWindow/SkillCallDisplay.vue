<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ToolOutlined, CaretRightOutlined, CaretDownOutlined } from '@ant-design/icons-vue'
import type { ToolCall } from '@/types/chat'

const { t } = useI18n()

defineProps<{
  toolCalls: ToolCall[]
}>()

const expanded = ref<Record<number, boolean>>({})

const toggleExpand = (index: number) => {
  expanded.value[index] = !expanded.value[index]
}

const summarizeJson = (obj?: Record<string, any>): string => {
  if (!obj) return '-'
  const keys = Object.keys(obj).slice(0, 3)
  return keys.map((k) => `${k}: ${JSON.stringify(obj[k])}`).join(', ')
}
</script>

<template>
  <div class="skill-call-display flex flex-col gap-1.5 my-1">
    <div
      v-for="(call, index) in toolCalls"
      :key="index"
      class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
    >
      <!-- Collapsed Header -->
      <div
        class="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors select-none"
        @click="toggleExpand(index)"
      >
        <ToolOutlined class="text-xs text-gray-400 shrink-0" />
        <a-tooltip :title="call.skill_description || call.skill_name">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-300 truncate">
            {{ call.skill_name }}
          </span>
        </a-tooltip>
        <span v-if="call.duration_ms" class="text-xs text-gray-400 ml-auto shrink-0">
          {{ call.duration_ms }}ms
        </span>
        <CaretDownOutlined v-if="expanded[index]" class="text-xs text-gray-400 shrink-0" />
        <CaretRightOutlined v-else class="text-xs text-gray-400 shrink-0" />
      </div>

      <!-- Expanded Detail -->
      <div
        v-if="expanded[index]"
        class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 space-y-1.5"
      >
        <div>
          <span class="font-medium text-gray-600 dark:text-gray-300"
            >{{ t('chat.skillCallArgs') }}：</span
          >
          <span class="font-mono text-gray-500 break-all">{{ summarizeJson(call.args) }}</span>
        </div>
        <div>
          <span class="font-medium text-gray-600 dark:text-gray-300"
            >{{ t('chat.skillCallResult') }}：</span
          >
          <span class="font-mono text-gray-500 break-all">{{ summarizeJson(call.result) }}</span>
        </div>
        <div v-if="call.duration_ms">
          <span class="font-medium text-gray-600 dark:text-gray-300"
            >{{ t('chat.skillCallDuration') }}：</span
          >
          <span>{{ call.duration_ms }}ms</span>
        </div>
      </div>
    </div>
  </div>
</template>
