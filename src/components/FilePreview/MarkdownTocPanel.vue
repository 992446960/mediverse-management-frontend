<template>
  <div
    v-if="items.length > 0"
    class="markdown-toc-panel shrink-0 w-44 border border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-800/80 p-2 overflow-y-auto"
  >
    <div class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 px-1">
      {{ t('knowledge.previewToc') }}
    </div>
    <ul class="list-none m-0 p-0 space-y-0.5">
      <li v-for="item in items" :key="item.id">
        <button
          type="button"
          class="w-full text-left text-xs rounded px-1.5 py-1 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-colors truncate"
          :style="{ paddingLeft: `${8 + (item.level - 1) * 10}px` }"
          @click="emit('jump', item.id)"
        >
          {{ item.text }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { MarkdownTocItem } from '@/utils/markdownToc'

const { t } = useI18n()

defineProps<{
  items: MarkdownTocItem[]
}>()

const emit = defineEmits<{
  jump: [id: string]
}>()
</script>
