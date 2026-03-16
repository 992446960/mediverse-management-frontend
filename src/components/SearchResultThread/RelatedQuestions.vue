<template>
  <div class="flex flex-wrap gap-2">
    <div
      v-for="(question, index) in questions"
      :key="index"
      class="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm rounded-full cursor-pointer transition-colors border border-gray-200 hover:border-blue-300 hover:text-blue-600"
      @click="$emit('select', question)"
    >
      {{ question }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  questions: string[]
}>()

defineEmits(['select'])
</script>
