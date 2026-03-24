<template>
  <div class="associated-files">
    <div class="associated-files__head mb-3 flex items-center justify-between gap-3">
      <div class="flex min-w-0 items-center gap-2">
        <PaperClipOutlined class="associated-files__clip shrink-0" />
        <span class="text-sm font-semibold text-(--color-text-base)">{{
          t('knowledge.card.sourceFile')
        }}</span>
      </div>
      <span v-if="rows.length" class="shrink-0 text-xs text-(--color-text-tertiary)">
        {{ t('knowledge.card.attachmentCount', { count: rows.length }) }}
      </span>
    </div>

    <div v-if="rows.length" class="flex flex-col gap-2">
      <div
        v-for="(row, index) in rows"
        :key="row.source.id || row.source.name || `f-${index}`"
        class="associated-files__card group flex cursor-pointer items-center gap-3 rounded-lg border border-(--color-border) bg-(--color-bg-container) p-3 transition-colors hover:bg-(--ant-color-fill-tertiary)"
        role="button"
        tabindex="0"
        :aria-label="row.source.name"
        @click="emit('open', row.source)"
        @keydown.enter.prevent="emit('open', row.source)"
      >
        <!-- 仅展示 assets/icons 对应类型图，无额外色块底 -->
        <div class="associated-files__thumb flex h-10 w-10 shrink-0 items-center justify-center">
          <img
            class="block h-10 w-10 max-h-10 max-w-10 object-contain select-none"
            :src="thumbSrc(row.thumbKind)"
            alt=""
            width="40"
            height="40"
            decoding="async"
            draggable="false"
          />
        </div>
        <div class="min-w-0 flex-1">
          <div
            class="associated-files__title font-medium wrap-break-word text-(--color-text-base) transition-colors duration-200 group-hover:text-primary"
          >
            {{ row.source.name }}
          </div>
          <div class="mt-0.5 text-xs text-(--color-text-tertiary)">
            {{ row.sizeLabel }}
          </div>
        </div>
        <a-spin v-if="openingId === row.source.id" class="shrink-0" size="small" />
      </div>
    </div>
    <a-empty v-else :description="t('knowledge.card.noSourceFile')" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PaperClipOutlined } from '@ant-design/icons-vue'
import pdfUrl from '@/assets/icons/pdf.svg'
import wordUrl from '@/assets/icons/word.svg'
import excelUrl from '@/assets/icons/excel.svg'
import pptUrl from '@/assets/icons/ppt.svg'
import unknowUrl from '@/assets/icons/unknow.svg'
import type { KnowledgeCard } from '@/types/knowledge'

defineProps<{
  rows: Array<{
    source: KnowledgeCard['source_files'][number]
    thumbKind: 'pdf' | 'doc' | 'xls' | 'ppt' | 'img' | 'txt' | 'default'
    sizeLabel: string
  }>
  openingId: string | null
}>()

const emit = defineEmits<{
  (e: 'open', item: KnowledgeCard['source_files'][number]): void
}>()

const { t } = useI18n()

/** doc/docx → word.svg；xls/xlsx/csv → excel.svg；与 classifyThumbKind 一致 */
const THUMB_SRC: Record<string, string> = {
  pdf: pdfUrl,
  doc: wordUrl,
  xls: excelUrl,
  ppt: pptUrl,
  img: unknowUrl,
  txt: unknowUrl,
  default: unknowUrl,
}

function thumbSrc(kind: string): string {
  return THUMB_SRC[kind] ?? unknowUrl
}
</script>

<style scoped>
.associated-files__clip {
  font-size: 16px;
  color: var(--color-primary);
}
</style>
