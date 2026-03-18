<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { FileTextOutlined } from '@ant-design/icons-vue'

const { t } = useI18n()

defineProps<{
  citations: string[]
}>()
</script>

<template>
  <div v-if="citations && citations.length > 0" class="source-citation mt-2">
    <div class="text-xs text-gray-400 mb-1">{{ t('chat.viewSource') }}</div>
    <div class="flex flex-wrap gap-2">
      <a-tooltip v-for="(cardId, index) in citations" :key="cardId" :title="cardId">
        <div
          class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <FileTextOutlined />
          <span class="text-gray-500">[{{ index + 1 }}]</span>
        </div>
      </a-tooltip>
    </div>
  </div>
</template>

<style scoped>
.source-citation {
  font-size: 12px;
}
</style>
