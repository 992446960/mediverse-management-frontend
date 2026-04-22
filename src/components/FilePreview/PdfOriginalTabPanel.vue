<template>
  <div class="pdf-tab-panel flex h-full min-h-0 flex-col overflow-hidden">
    <PdfViewer
      v-if="fileUrl"
      ref="pdfViewerRef"
      :key="`${cacheKey}-pdf-original`"
      :file-url="fileUrl"
    />
    <a-empty v-else class="py-12" :description="t('knowledge.noPreviewUrl')" />
  </div>
</template>

<script lang="ts">
export default {
  name: 'PdfOriginalTabPanel',
}
</script>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import PdfViewer from './PdfViewer.vue'

const { t } = useI18n()

defineProps<{
  fileUrl: string
  /** 与文件 id 绑定，换文件时强制重建 PdfViewer */
  cacheKey: string
}>()

const pdfViewerRef = ref<InstanceType<typeof PdfViewer> | null>(null)

/** KeepAlive 只激活直接子组件，在此转发给 PdfViewer 做 layout 修正 */
onActivated(() => {
  nextTick(() => {
    pdfViewerRef.value?.rerenderLayout?.()
  })
})
</script>
