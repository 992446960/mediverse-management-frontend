<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="(question, index) in questions"
      :key="index"
      type="button"
      class="kb-related-question px-3 py-1.5 text-sm rounded-full cursor-pointer transition-colors border text-left"
      @click="$emit('select', question)"
    >
      {{ question }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  questions: string[]
}>()

defineEmits(['select'])
</script>

<style scoped>
.kb-related-question {
  color: var(--color-text-secondary);
  background-color: var(--color-bg-layout);
  border-color: var(--color-border);
  box-shadow: var(--shadow-sm);
}
.kb-related-question:hover {
  color: var(--color-primary);
  border-color: color-mix(in srgb, var(--color-primary) 45%, var(--color-border));
  background-color: color-mix(in srgb, var(--color-primary) 10%, var(--color-bg-layout));
}
.kb-related-question:active {
  background-color: color-mix(in srgb, var(--color-primary) 16%, var(--color-bg-layout));
}
.kb-related-question:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
