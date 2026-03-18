<template>
  <a-tooltip :title="citation.title">
    <span
      class="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full cursor-pointer hover:bg-blue-100 transition-colors mr-1"
      @click="showDetails"
    >
      {{ index }}
    </span>
  </a-tooltip>

  <a-modal v-model:open="detailsVisible" :title="citation.title" footer="">
    <div class="prose prose-sm max-w-none">
      <p class="text-gray-600">{{ citation.content }}</p>
      <div v-if="citation.url" class="mt-4">
        <a :href="citation.url" target="_blank" class="text-blue-600 hover:underline">{{
          t('knowledgeSearch.viewOriginal')
        }}</a>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Citation } from '@/api/knowledgeSearch'

const { t } = useI18n()

defineProps<{
  citation: Citation
  index: number
}>()

const detailsVisible = ref(false)

const showDetails = () => {
  detailsVisible.value = true
}
</script>
