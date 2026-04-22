<template>
  <div class="pdf-tab-panel flex h-full min-h-0 flex-col overflow-hidden">
    <ParsedDocViewer :parsed-file-url="parsedFileUrl" />
  </div>
</template>

<script lang="ts">
export default {
  name: 'PdfParsedTabPanel',
}
</script>

<script setup lang="ts">
import ParsedDocViewer from './ParsedDocViewer.vue'

defineProps<{
  parsedFileUrl: string | null | undefined
}>()
</script>
