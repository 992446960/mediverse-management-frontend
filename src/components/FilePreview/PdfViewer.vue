<template>
  <div class="pdf-viewer h-full min-h-[400px] overflow-auto bg-white dark:bg-slate-900">
    <a-empty v-if="errorMessage" :description="errorMessage" class="py-12" />
    <vue-office-pdf
      v-else-if="fileUrl"
      :key="fileUrl"
      :src="fileUrl"
      class="min-h-full"
      @rendered="onRendered"
      @error="onError"
    />
    <a-empty v-else :description="t('knowledge.noPreviewUrl')" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import VueOfficePdf from '@vue-office/pdf'

const { t } = useI18n()

const props = defineProps<{
  fileUrl: string
}>()

const emit = defineEmits<{
  rendered: []
  error: [err: unknown]
}>()

const errorMessage = ref<string | null>(null)

watch(
  () => props.fileUrl,
  () => {
    errorMessage.value = null
  }
)

function onRendered() {
  errorMessage.value = null
  emit('rendered')
}

function onError(err: unknown) {
  const msg = err instanceof Error ? err.message : t('knowledge.pdfUnknownError')
  errorMessage.value = t('knowledge.pdfLoadFailed', { msg })
  emit('error', err)
}
</script>

<style scoped>
.pdf-viewer :deep(.vue-office-pdf) {
  min-height: 100%;
}
</style>
