<template>
  <div class="step-type">
    <div class="space-y-4">
      <label
        v-for="opt in AVATAR_WIZARD_TYPE_OPTIONS"
        :key="opt.value"
        class="block cursor-pointer group"
      >
        <input
          type="radio"
          :value="opt.value"
          :checked="modelValue.type === opt.value"
          class="sr-only"
          :aria-label="t(opt.titleKey)"
          @change="emit('update:modelValue', { ...modelValue, type: opt.value })"
        >
        <div
          class="flex items-center p-4 rounded-lg border-2 transition-all duration-200"
          :class="modelValue.type === opt.value
            ? 'border-[#0ea5e9] bg-sky-50 dark:bg-sky-900/20'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 hover:border-[#0ea5e9]/50'"
        >
          <div class="mr-4 shrink-0">
            <div
              class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200"
              :class="modelValue.type === opt.value
                ? 'border-[#0ea5e9]'
                : 'border-gray-300 dark:border-gray-600'"
            >
              <div
                v-if="modelValue.type === opt.value"
                class="w-2.5 h-2.5 rounded-full bg-[#0ea5e9]"
              />
              <div
                v-else
                class="w-2.5 h-2.5 rounded-full bg-transparent"
              />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-medium text-gray-900 dark:text-gray-100">
              {{ t(opt.titleKey) }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {{ t(opt.detailKey) }}
            </p>
          </div>
        </div>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AVATAR_WIZARD_TYPE_OPTIONS, type AvatarWizardForm } from '@/types/avatar'

const { t } = useI18n()

defineProps<{
  modelValue: AvatarWizardForm
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AvatarWizardForm]
}>()
</script>
