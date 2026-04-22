<template>
  <div
    class="page-table p-2.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0"
    :style="{ '--min-height': tableConf?.tableMinHeight ?? '200px' }"
  >
    <!-- 顶部工具栏 -->
    <div
      v-if="!tableConf?.hideTableBar"
      class="page-table__toolbar h-[52px] px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0"
    >
      <div class="flex items-center gap-2">
        <span v-if="(tableConf?.total ?? 0) > 0" class="text-sm text-slate-500">
          {{ t('common.totalCount', { count: tableConf?.total ?? 0 }) }}
        </span>
        <a-button type="text" :disabled="tableConf?.isLoading" @click="onRefresh">
          <template #icon>
            <ReloadOutlined class="text-xs" style="color: var(--color-text-tertiary)" />
          </template>
        </a-button>
        <span
          v-if="tableConf?.updateTime"
          class="text-xs text-slate-400"
          :title="String(tableConf.updateTime)"
        >
          {{ t('common.lastUpdateTime', { time: tableConf.updateTime }) }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <a-button type="text" @click="openColumnsEditor">
          <template #icon>
            <SettingOutlined />
          </template>
        </a-button>
      </div>
    </div>

    <!-- 表格主体 -->
    <div ref="tableContainerRef" class="page-table__body flex-1 overflow-hidden min-h-0">
      <a-table
        :columns="antdvColumns"
        :data-source="tableData"
        :loading="tableConf?.isLoading"
        :row-key="(r: Record<string, any>) => String(r[tableConf?.rowKey ?? 'id'])"
        :row-selection="rowSelectionConfig"
        :scroll="scrollConfig"
        table-layout="fixed"
        :pagination="false"
        :bordered="tableConf?.border"
        :locale="{ emptyText: tableConf?.emptyText ?? t('common.noData') }"
        @change="onTableChange"
        @resize-column="handleResizeColumn"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="getColExt(column).type === 'index'">
            {{ getIndexDisplay(column, index) }}
          </template>
          <template v-else-if="getColExt(column).type === 'scope'">
            <ScopeCell :column="getColExt(column)" :record="record" :index="index" />
          </template>
          <template v-else-if="getColExt(column).type === 'slot'">
            <slot
              :name="getColExt(column).slotName"
              :row="record"
              :column="getColExt(column)"
              :index="index"
            />
          </template>
          <template v-else-if="getColExt(column).type === 'operation'">
            <OperationCell :column="getColExt(column)" :record="record" :index="index" />
          </template>
          <template v-else>
            <span
              v-if="getColExt(column).showOverflowTooltip"
              class="block truncate"
              :title="getCellText(record, column)"
            >
              {{ getCellText(record, column) }}
            </span>
            <span v-else>{{ getCellText(record, column) }}</span>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 分页器 -->
    <div
      v-if="paginationConfig"
      class="page-table__pagination px-6 py-4 flex justify-end border-t border-slate-100 dark:border-slate-800"
    >
      <a-pagination
        v-model:current="currentPage"
        v-model:page-size="pageSize"
        :total="tableConf?.total ?? 0"
        :show-size-changer="true"
        :show-quick-jumper="true"
        :page-size-options="pageSizeOptions"
        :show-total="(total: number) => t('common.totalCount', { count: total })"
        @change="onPageChange"
        @show-size-change="onPageChange"
      />
    </div>

    <!-- 列设置弹窗 -->
    <ColumnsEditor
      v-model:open="columnsEditorVisible"
      :columns="effectiveColumns"
      @update:columns="onColumnsApply"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Key } from 'ant-design-vue/es/table/interface'
import type { ColumnsType } from 'ant-design-vue/es/table'
import { ReloadOutlined, SettingOutlined } from '@ant-design/icons-vue'
import ColumnsEditor from './ColumnsEditor.vue'
import OperationCell from './OperationCell.vue'
import ScopeCell from './ScopeCell.vue'
import type { PageTableConfig, PageTableColumnConfig } from './types'

const { t } = useI18n()

const DEFAULT_SCROLL_Y = 400
const TABLE_MARGIN_BOTTOM = 100

const props = withDefaults(
  defineProps<{
    tableConf?: PageTableConfig
    tableColumns: PageTableColumnConfig[]
    tableData?: Record<string, any>[]
  }>(),
  {
    tableConf: () => ({}),
    tableData: () => [],
  }
)

const emit = defineEmits<{
  'fetch-table-data': []
  'update:tableColumns': [value: PageTableColumnConfig[]]
}>()

const currentPage = ref(1)
const pageSize = ref(props.tableConf?.paginationSizes?.[0] ?? 20)
const multipleSelection = ref<Record<string, any>[]>([])
const selectedRowKeys = ref<Key[]>([])
const sortParams = ref<{ prop: string; order: string } | null>(null)
const columnsEditorVisible = ref(false)
const tableContainerRef = ref<HTMLElement | null>(null)
const measuredScrollY = ref(0)
let resizeObserver: ResizeObserver | null = null
let scrollResizeDebounceTimer: ReturnType<typeof setTimeout> | null = null
let hasAppliedObserverScrollY = false

/** 内部维护的列配置（含 _visible/_index），用于列设置与表格渲染 */
const effectiveColumns = ref<PageTableColumnConfig[]>([])

/** 与 antd Table resizeColumn 回调中的列对齐：用 dataIndex/key 写回 effectiveColumns（避免当次渲染的临时 column 对象被丢弃导致宽度回弹） */
function handleResizeColumn(w: number, col: Record<string, unknown>) {
  const rawDi = col.dataIndex ?? col.prop
  const dataIndex = rawDi == null ? '' : Array.isArray(rawDi) ? rawDi.join('.') : String(rawDi)
  const keyStr = col.key != null ? String(col.key) : ''
  const rounded = Math.round(Number(w))
  if (!Number.isFinite(rounded)) return

  const list = effectiveColumns.value
  for (let i = 0; i < list.length; i++) {
    const ec = list[i]
    if (!ec) continue
    const matchProp = ec.prop != null && dataIndex !== '' && String(ec.prop) === dataIndex
    const matchKey =
      keyStr !== '' && (String(ec._id ?? '') === keyStr || String(ec.prop ?? '') === keyStr)
    if (matchProp || matchKey) {
      ec.width = rounded
      break
    }
  }
}

function normalizeColumnWidth(
  width: number | string | undefined,
  resizable?: boolean
): number | string | undefined {
  if (!resizable || width == null || width === '') return width
  const n = typeof width === 'number' ? width : Number.parseFloat(String(width))
  if (!Number.isFinite(n)) return 80
  return n
}

function getColKey(c: PageTableColumnConfig): string {
  return String(c._id ?? c.prop ?? '')
}

watch(
  () => props.tableColumns,
  (cols) => {
    if (!cols?.length) return
    if (effectiveColumns.value.length === 0) {
      effectiveColumns.value = cols.map((c, i) => ({
        ...c,
        _index: c._defaultIndex ?? i,
        _defaultIndex: c._defaultIndex ?? i,
        _visible: c._defaultVisible ?? true,
        _defaultVisible: c._defaultVisible ?? true,
      }))
    } else {
      const colMap = new Map(cols.map((c) => [getColKey(c), c]))
      effectiveColumns.value = effectiveColumns.value.map((eff) => {
        const next = colMap.get(getColKey(eff))
        if (!next) return eff
        return {
          ...eff,
          label: next.label,
          btns: next.btns,
          formatter: next.formatter,
          tagType: next.tagType,
          tagText: next.tagText,
          scopeType: next.scopeType,
          slotName: next.slotName,
          linkFn: next.linkFn,
          linkDisabled: next.linkDisabled,
          switchFn: next.switchFn,
          imageWidth: next.imageWidth,
          imageHeight: next.imageHeight,
          max: next.max,
        }
      })
    }
  },
  { immediate: true }
)

const pageSizeOptions = computed(() =>
  (props.tableConf?.paginationSizes ?? [20, 50, 100, 200]).map(String)
)

const antdvColumns = computed<ColumnsType>(() => {
  const cols = [...(effectiveColumns.value ?? [])]
    .filter((c) => c.type !== 'selection' && c._visible !== false)
    .sort((a, b) => (a._index ?? 0) - (b._index ?? 0))
  return cols.map((c, colIdx) => ({
    title: c.label,
    dataIndex: c.prop,
    key: c._id ?? c.prop ?? `page-table-col-${colIdx}`,
    prop: c.prop,
    width: normalizeColumnWidth(c.width, c.resizable),
    fixed: c.fixed,
    align: c.align,
    resizable: c.resizable,
    ellipsis: c.showOverflowTooltip,
    sorter: c.sortable,
    customRender: undefined,
    type: c.type,
    scopeType: c.scopeType,
    slotName: c.slotName,
    btns: c.btns,
    formatter: c.formatter,
    showOverflowTooltip: c.showOverflowTooltip,
    linkFn: c.linkFn,
    linkDisabled: c.linkDisabled,
    tagType: c.tagType,
    tagText: c.tagText,
    switchFn: c.switchFn,
    imageWidth: c.imageWidth,
    imageHeight: c.imageHeight,
    max: c.max,
  }))
})

const selectionCol = computed(() => effectiveColumns.value?.find((c) => c.type === 'selection'))

const rowSelectionConfig = computed(() => {
  const col = selectionCol.value
  if (!col) return undefined
  return {
    selectedRowKeys: selectedRowKeys.value,
    preserveSelectedRowKeys: col.reserveSelection,
    getCheckboxProps: (record: Record<string, any>) => ({
      disabled: col.selectDisabled?.(record),
    }),
    onChange: (keys: Key[], rows: Record<string, any>[]) => {
      selectedRowKeys.value = keys
      multipleSelection.value = rows
      emit('fetch-table-data')
    },
  }
})

const paginationConfig = computed(() => {
  const total = props.tableConf?.total ?? 0
  if (total <= 0) return false
  return {
    current: currentPage.value,
    pageSize: pageSize.value,
    total,
  }
})

const scrollConfig = computed(() => {
  const h = props.tableConf?.tableHeight
  if (h != null && h !== '') return { y: h }
  if (measuredScrollY.value > 0) return { y: measuredScrollY.value }
  return { y: DEFAULT_SCROLL_Y }
})

function getColExt(column: Record<string, any>): PageTableColumnConfig {
  return column as PageTableColumnConfig
}

function getCellValue(record: Record<string, any>, column: Record<string, any>): unknown {
  const prop = column.dataIndex ?? column.prop
  if (prop == null) return undefined
  const key = Array.isArray(prop) ? prop.join('.') : prop
  return record[key as string]
}

function getCellText(record: Record<string, any>, column: Record<string, any>): string {
  const ext = getColExt(column)
  const value = ext.formatter?.(record) ?? getCellValue(record, column)
  if (value == null) return ''
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

function getIndexDisplay(column: Record<string, any>, index: number): number | string {
  const ext = getColExt(column)
  if (ext.indexMethod) return ext.indexMethod(index)
  return (currentPage.value - 1) * pageSize.value + index + 1
}

function onTableChange(
  _pagination: unknown,
  _filters: unknown,
  sorter: { field?: string; order?: string } | unknown
) {
  const s = sorter as { field?: string; order?: string }
  if (s?.field && s?.order) {
    sortParams.value = { prop: String(s.field), order: s.order === 'ascend' ? 'asc' : 'desc' }
  } else {
    sortParams.value = null
  }
  emit('fetch-table-data')
}

function onPageChange() {
  emit('fetch-table-data')
}

function onRefresh() {
  emit('fetch-table-data')
}

function openColumnsEditor() {
  columnsEditorVisible.value = true
}

function onColumnsApply(next: PageTableColumnConfig[]) {
  effectiveColumns.value = next
  emit('update:tableColumns', next)
}

function resetCurPage(newPage = 1) {
  currentPage.value = newPage
}

function clearSelection() {
  selectedRowKeys.value = []
  multipleSelection.value = []
}

function scrollTop(value?: number) {
  const el = tableContainerRef.value?.querySelector('.ant-table-body')
  if (el) el.scrollTop = value ?? 0
}

function setTableHeight() {
  const el = tableContainerRef.value
  if (!el) return
  const h = el.getBoundingClientRect().height
  measuredScrollY.value = Math.max(100, Math.floor(h) - TABLE_MARGIN_BOTTOM)
}

onMounted(() => {
  pageSize.value = props.tableConf?.paginationSizes?.[0] ?? 20
  const el = tableContainerRef.value
  if (!el) return
  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) return
    const { height } = entry.contentRect
    const nextY = Math.max(100, Math.floor(height) - TABLE_MARGIN_BOTTOM)
    if (!hasAppliedObserverScrollY) {
      measuredScrollY.value = nextY
      hasAppliedObserverScrollY = true
      return
    }
    if (scrollResizeDebounceTimer != null) clearTimeout(scrollResizeDebounceTimer)
    scrollResizeDebounceTimer = setTimeout(() => {
      measuredScrollY.value = nextY
      scrollResizeDebounceTimer = null
    }, 48)
  })
  resizeObserver.observe(el)
})

onUnmounted(() => {
  if (scrollResizeDebounceTimer != null) clearTimeout(scrollResizeDebounceTimer)
  scrollResizeDebounceTimer = null
  hasAppliedObserverScrollY = false
  resizeObserver?.disconnect()
  resizeObserver = null
})

defineExpose({
  multipleSelection,
  sortParams,
  currentPage,
  pageSize,
  setTableHeight,
  resetCurPage,
  clearSelection,
  scrollTop,
})
</script>

<style scoped>
.page-table :deep(.ant-table-thead > tr > th) {
  font-weight: 600;
  font-size: 13px;
  padding: 16px 24px;
}
.page-table :deep(.ant-table-tbody > tr > td) {
  padding: 20px 24px;
  font-size: 13px;
}
.page-table__body :deep(.ant-table-body) {
  min-height: var(--min-height);
}
</style>
