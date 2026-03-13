<template>
  <div class="num-range flex items-center gap-2">
    <a-input-number
      :value="minValue"
      :placeholder="minPh ?? t('common.minValue')"
      :min="min"
      :max="max"
      class="flex-1"
      @update:value="onMinChange"
    />
    <span class="text-slate-400">~</span>
    <a-input-number
      :value="maxValue"
      :placeholder="maxPh ?? t('common.maxValue')"
      :min="min"
      :max="max"
      class="flex-1"
      @update:value="onMaxChange"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    modelValue?: { min?: number; max?: number } | null
    minPh?: string
    maxPh?: string
    min?: number
    max?: number
  }>(),
  {
    modelValue: undefined,
    minPh: undefined,
    maxPh: undefined,
    min: undefined,
    max: undefined,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: { min?: number; max?: number } | null]
  change: []
}>()

const minValue = computed(() => props.modelValue?.min)
const maxValue = computed(() => props.modelValue?.max)

function onMinChange(v: number | null) {
  const next = { ...props.modelValue, min: v ?? undefined }
  emit('update:modelValue', Object.keys(next).length ? next : null)
  emit('change')
}

function onMaxChange(v: number | null) {
  const next = { ...props.modelValue, max: v ?? undefined }
  emit('update:modelValue', Object.keys(next).length ? next : null)
  emit('change')
}
</script>
