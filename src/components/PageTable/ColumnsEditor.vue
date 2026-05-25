<template>
  <a-modal v-model:open="open" :title="t('common.columnSettings')" :width="720" @ok="applyColumns">
    <div class="columns-editor">
      <div class="mb-3 text-xs text-slate-400">
        {{ t('common.listSettingsDesc') }}
      </div>
      <div
        class="grid grid-cols-[32px_minmax(120px,1fr)_92px_132px_196px] items-center gap-3 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        <span></span>
        <span>{{ t('common.columnName') }}</span>
        <span>{{ t('common.columnVisible') }}</span>
        <span>{{ t('common.columnResizable') }}</span>
        <span>{{ t('common.columnFixed') }}</span>
      </div>
      <div
        v-for="(col, index) in editableColumns"
        :key="col._id ?? col.prop ?? index"
        class="grid grid-cols-[32px_minmax(120px,1fr)_92px_132px_196px] items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 last:border-0"
        :draggable="getAbility(col).order"
        @dragstart="onDragStart($event, index)"
        @dragover.prevent="onDragOver($event)"
        @drop="onDrop($event, index)"
      >
        <MenuOutlined
          class="text-sm text-slate-300"
          :class="getAbility(col).order ? 'cursor-grab' : 'cursor-not-allowed opacity-50'"
        />
        <div class="min-w-0">
          <div class="truncate text-sm text-slate-700 dark:text-slate-200">
            {{ getColumnSettingsLabel(col, t('common.selectionColumn')) }}
          </div>
          <div v-if="col.lock" class="text-xs text-slate-400">{{ t('common.locked') }}</div>
        </div>
        <div class="flex items-center">
          <a-checkbox
            :checked="col._visible !== false"
            :disabled="!getAbility(col).visible"
            @update:checked="(v: boolean) => toggleVisible(col, v)"
          />
        </div>
        <div class="flex items-center">
          <a-switch
            size="small"
            class="columns-editor__switch"
            :checked="col.resizable === true"
            :disabled="!getAbility(col).resizable"
            @update:checked="(v: boolean) => toggleResizable(col, v)"
          />
        </div>
        <div class="flex items-center">
          <a-button
            v-for="option in fixedOptions"
            :key="String(option.value)"
            size="small"
            class="columns-editor__fixed-btn"
            :class="{ 'columns-editor__fixed-btn--active': col.fixed === option.value }"
            :disabled="!getAbility(col).fixed"
            @click="setFixed(col, option.value)"
          >
            {{ option.label }}
          </a-button>
        </div>
      </div>
    </div>
    <template #footer>
      <a-button @click="resetColumns">{{ t('common.reset') }}</a-button>
      <a-button type="primary" @click="applyColumns">{{ t('common.confirm') }}</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { MenuOutlined } from '@ant-design/icons-vue'
import {
  getColumnConfigAbility,
  getColumnSettingsLabel,
  resetColumnSettingsState,
} from './columnSettings'
import type { PageTableColumnConfig } from './types'

const { t } = useI18n()

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
const fixedOptions = computed<{ label: string; value: false | 'left' | 'right' }[]>(() => [
  { label: t('common.notFixed'), value: false },
  { label: t('common.fixedLeft'), value: 'left' },
  { label: t('common.fixedRight'), value: 'right' },
])

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
  const column = editableColumns.value[index]
  if (!column || !getColumnConfigAbility(column).order) {
    e.preventDefault()
    return
  }
  dragIndex = index
  e.dataTransfer?.setData('text/plain', String(index))
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
}

function onDrop(_e: DragEvent, index: number) {
  _e.preventDefault()
  if (dragIndex < 0 || dragIndex === index) return
  const targetColumn = editableColumns.value[index]
  if (!targetColumn || !getColumnConfigAbility(targetColumn).order) return
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

function toggleResizable(col: PageTableColumnConfig, v: boolean) {
  col.resizable = v
}

function setFixed(col: PageTableColumnConfig, value: false | 'left' | 'right') {
  col.fixed = value
}

function getAbility(col: PageTableColumnConfig) {
  return getColumnConfigAbility(col)
}

function resetColumns() {
  editableColumns.value = resetColumnSettingsState(props.columns)
}

function applyColumns() {
  emit('update:columns', editableColumns.value)
  emit('update:open', false)
}
</script>

<style scoped>
.columns-editor__fixed-btn {
  min-width: 56px;
  border-radius: 0;
  padding-inline: 8px;
}

.columns-editor__fixed-btn:first-child {
  border-start-start-radius: 4px;
  border-end-start-radius: 4px;
}

.columns-editor__fixed-btn:last-child {
  border-start-end-radius: 4px;
  border-end-end-radius: 4px;
}

.columns-editor__fixed-btn--active {
  position: relative;
  z-index: 1;
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.columns-editor__fixed-btn--active:not(:disabled):hover {
  color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.columns-editor :deep(.columns-editor__switch.ant-switch) {
  width: 44px;
  min-width: 44px;
  padding: 0;
  background: #cbd5e1;
}

.columns-editor :deep(.columns-editor__switch.ant-switch.ant-switch-checked) {
  background: var(--color-primary);
}

.columns-editor :deep(.columns-editor__switch.ant-switch:not(.ant-switch-disabled):hover) {
  background: #94a3b8;
}

.columns-editor
  :deep(.columns-editor__switch.ant-switch.ant-switch-checked:not(.ant-switch-disabled):hover) {
  background: var(--color-primary-hover);
}
</style>
