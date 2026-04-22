<template>
  <a-tag v-if="option" :color="option.color || 'default'">
    {{ option.label }}
  </a-tag>
  <span v-else>{{ value }}</span>
</template>

<script setup lang="ts">
import type { DictOption } from '@/composables/useDict'

const props = defineProps<{
  options: DictOption[]
  value: string | number | boolean
}>()

const option = computed(() => props.options.find((opt) => opt.value === props.value))
</script>
