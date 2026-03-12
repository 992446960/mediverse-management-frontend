<template>
  <div class="excel-viewer h-full overflow-auto bg-white dark:bg-slate-900 p-4">
    <vue-office-excel
      v-if="fileUrl"
      :src="fileUrl"
      class="min-h-full"
      @rendered="onRendered"
      @error="onError"
    />
    <a-empty v-else description="暂无预览地址" />
  </div>
</template>

<script setup lang="ts">
import VueOfficeExcel from '@vue-office/excel'

defineProps<{
  fileUrl: string
}>()

const emit = defineEmits<{
  rendered: []
  error: [err: unknown]
}>()

function onRendered() {
  emit('rendered')
}

function onError(err: unknown) {
  emit('error', err)
}
</script>

<style scoped>
.excel-viewer :deep(.vue-office-excel) {
  min-height: 100%;
}
</style>
