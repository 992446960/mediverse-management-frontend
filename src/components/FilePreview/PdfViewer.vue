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
    <a-empty v-else description="暂无预览地址" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import VueOfficePdf from '@vue-office/pdf'

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
  const msg = err instanceof Error ? err.message : String(err ?? '未知错误')
  errorMessage.value = `PDF 加载失败：${msg}`
  emit('error', err)
}
</script>

<style scoped>
.pdf-viewer :deep(.vue-office-pdf) {
  min-height: 100%;
}
</style>
