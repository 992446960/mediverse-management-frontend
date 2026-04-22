<template>
  <a-tooltip :title="citation.title">
    <span
      class="kb-citation-index inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full cursor-pointer transition-colors mr-1"
      @click="showDetails"
    >
      {{ index }}
    </span>
  </a-tooltip>

  <a-modal v-model:open="detailsVisible" :title="citation.title" footer="">
    <div>
      <CitationPreviewHtml :content="citation.content" variant="modal" />
      <div v-if="citation.url" class="mt-4">
        <a :href="citation.url" target="_blank" class="text-primary hover:underline">{{
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
import CitationPreviewHtml from '@/components/CitationPreviewHtml/index.vue'

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

<style scoped>
.kb-citation-index {
  color: var(--color-primary);
  background-color: color-mix(in srgb, var(--color-primary) 12%, transparent);
}
.kb-citation-index:hover {
  background-color: color-mix(in srgb, var(--color-primary) 22%, transparent);
}
</style>
