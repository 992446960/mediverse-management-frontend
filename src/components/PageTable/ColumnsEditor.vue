<template>
  <a-modal
    v-model:open="open"
    title="列设置"
    :width="480"
    @ok="applyColumns"
  >
    <div class="columns-editor">
      <div
        v-for="(col, index) in editableColumns"
        :key="col._id ?? col.prop ?? index"
        class="flex items-center gap-2 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
        :draggable="!col.lock"
        @dragstart="onDragStart($event, index)"
        @dragover.prevent="onDragOver($event, index)"
        @drop="onDrop($event, index)"
      >
        <a-checkbox
          :checked="col._visible !== false"
          :disabled="col.lock"
          @update:checked="(v: boolean) => toggleVisible(col, v)"
        >
          {{ col.label }}
        </a-checkbox>
        <span v-if="col.lock" class="text-xs text-slate-400">(锁定)</span>
      </div>
    </div>
    <template #footer>
      <a-button @click="resetColumns">重置</a-button>
      <a-button type="primary" @click="applyColumns">确定</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PageTableColumnConfig } from './types'

const props = defineProps<{
  open: boolean
  columns: PageTableColumnConfig[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:columns': [value: PageTableColumnConfig[]]
}>()

const open = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
})

const editableColumns = ref<PageTableColumnConfig[]>([])

watch(
  () => [props.open, props.columns] as const,
  ([isOpen, cols]) => {
    if (isOpen && cols?.length) {
      editableColumns.value = cols.map((c) => ({ ...c }))
    }
  },
  { immediate: true }
)

let dragIndex = -1

function onDragStart(e: DragEvent, index: number) {
  dragIndex = index
  e.dataTransfer?.setData('text/plain', String(index))
}

function onDragOver(e: DragEvent, _index: number) {
  e.preventDefault()
}

function onDrop(_e: DragEvent, index: number) {
  _e.preventDefault()
  if (dragIndex < 0 || dragIndex === index) return
  const list = [...editableColumns.value]
  const [item] = list.splice(dragIndex, 1)
  if (item) list.splice(index, 0, item)
  list.forEach((c, i) => {
    c._index = i
  })
  editableColumns.value = list
  dragIndex = -1
}

function toggleVisible(col: PageTableColumnConfig, v: boolean) {
  col._visible = v
}

function resetColumns() {
  const restored = props.columns.map((c) => ({
    ...c,
    _visible: c._defaultVisible ?? true,
    _index: c._defaultIndex ?? 0,
  }))
  restored.sort((a, b) => (a._index ?? 0) - (b._index ?? 0))
  restored.forEach((c, i) => {
    c._index = i
  })
  editableColumns.value = restored
}

function applyColumns() {
  emit('update:columns', editableColumns.value)
  emit('update:open', false)
}
</script>
