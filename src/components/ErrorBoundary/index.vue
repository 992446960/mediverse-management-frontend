<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'

const hasError = ref(false)
const error = ref<Error | null>(null)

onErrorCaptured((err: Error) => {
  error.value = err
  hasError.value = true
  return false
})
</script>

<template>
  <div v-if="hasError && error" class="error-boundary">
    <p class="text-red-600">加载出错：{{ error?.message }}</p>
  </div>
  <slot v-else />
</template>

<style scoped>
.error-boundary {
  padding: 1rem;
  text-align: center;
}
</style>
