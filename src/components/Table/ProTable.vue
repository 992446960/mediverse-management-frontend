<template>
  <div
    class="pro-table-wrapper pro-table-wrapper--fill rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0"
    :class="{ 'pro-table-card': hasHeader }"
  >
    <!-- 顶栏：标题 + 条数/更新时间 + 工具栏 -->
    <template v-if="hasHeader">
      <div
        class="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0"
      >
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-sm font-bold text-slate-800 dark:text-slate-100">{{ title }}</span>
          <span v-if="effectiveSubtitle" class="text-xs text-slate-400">{{ effectiveSubtitle }}</span>
          <!-- 默认顶栏：无 tableBar 时展示「| 刷新 数据最后更新时间」 -->
          <template v-if="showDefaultBar && !tableBar">
            <span class="text-slate-300 dark:text-slate-600">|</span>
            <button
              type="button"
              class="inline-flex items-center p-1 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="loading"
              aria-label="刷新"
              @click="emit('refresh')"
            >
              <ReloadOutlined class="text-[14px]" />
            </button>
            <span
              v-if="dataLastUpdateTime"
              class="text-xs text-slate-400"
              :title="dataLastUpdateTime"
            >
              数据最后更新时间：{{ dataLastUpdateTime }}
            </span>
          </template>
          <!-- 自定义 tableBar -->
          <template
            v-else-if="
              tableBar &&
              !tableBar.hide &&
              (tableBar.updateTime || showTotalInBar || tableBar.showRefresh)
            "
          >
            <span class="text-slate-300 dark:text-slate-600">|</span>
            <span v-if="showTotalInBar" class="text-xs text-slate-500">{{ totalLabelText }}</span>
            <button
              v-if="tableBar.showRefresh && tableBar.onRefresh"
              type="button"
              class="inline-flex items-center p-1 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="loading"
              aria-label="刷新"
              @click="onBarRefresh"
            >
              <ReloadOutlined class="text-[14px]" />
            </button>
            <span
              v-if="tableBar.updateTime"
              class="text-xs text-slate-400"
              :title="tableBar.updateTime"
            >
              数据最后更新时间：{{ tableBar.updateTime }}
            </span>
          </template>
        </div>
        <div v-if="$slots.toolbar || toolbarFiltered.length" class="flex items-center gap-2">
          <template v-if="$slots.toolbar">
            <slot name="toolbar" />
          </template>
          <template v-else-if="toolbarFiltered.length">
            <button
              v-for="item in toolbarFiltered"
              :key="item.key"
              type="button"
              class="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :title="item.title"
              :disabled="item.disabled"
              :aria-label="item.title"
              @click="item.handle()"
            >
              <component :is="toolIconMap[item.icon]" class="text-[16px]" />
            </button>
          </template>
        </div>
      </div>
    </template>
    <div ref="tableContainerRef" class="flex-1 overflow-hidden min-h-0">
      <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="paginationConfig"
        :row-key="rowKey"
        :scroll="scroll"
        :locale="locale"
        class="pro-table-ref-style"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record, index }">
          <!-- 1) 扩展列：按 cellType 数据驱动渲染 -->
          <template v-if="getColumnExt(column).cellType === 'link'">
            <button
              type="button"
              class="text-primary hover:underline text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="getColumnExt(column).linkDisabled?.(record)"
              @click="getColumnExt(column).linkFn?.(record)"
            >
              {{ getColumnExt(column).linkText?.(record) ?? getCellText(record, column) }}
            </button>
          </template>
          <template v-else-if="getColumnExt(column).cellType === 'tag'">
            <a-tag :color="getColumnExt(column).tagType?.(record) ?? 'default'">
              {{ getColumnExt(column).tagText?.(record) ?? getCellText(record, column) }}
            </a-tag>
          </template>
          <template v-else-if="getColumnExt(column).cellType === 'status'">
            <span
              class="inline-flex items-center gap-1 text-[12px] font-medium"
              :class="isStatusActive(record, column) ? 'text-emerald-600' : 'text-slate-400'"
            >
              <span
                class="w-1.5 h-1.5 rounded-full shrink-0"
                :class="isStatusActive(record, column) ? 'bg-emerald-500' : 'bg-slate-300'"
              />
              {{
                isStatusActive(record, column)
                  ? (getColumnExt(column).statusLabels?.active ?? 'Active')
                  : (getColumnExt(column).statusLabels?.inactive ?? 'Inactive')
              }}
            </span>
          </template>
          <template v-else-if="getColumnExt(column).cellType === 'date'">
            {{ formatCellDate(record, column) }}
          </template>
          <template
            v-else-if="
              getColumnExt(column).cellType === 'actions' && getColumnExt(column).btns?.length
            "
          >
            <div class="flex items-center justify-end gap-3 flex-wrap">
              <template v-for="(btn, bIdx) in getColumnExt(column).btns" :key="bIdx">
                <template v-if="btn.btnIsShow?.(record) !== false">
                  <a-popconfirm
                    v-if="btn.popconfirm"
                    :title="btn.popconfirm"
                    :ok-type="btn.popconfirmType ?? 'danger'"
                    @confirm="btn.handle(record)"
                  >
                    <template #default>
                      <a-button
                        type="link"
                        size="small"
                        :disabled="btn.btnDisabled?.(record)"
                        :class="['p-0 min-w-0', btn.danger ? 'text-rose-500' : '']"
                      >
                        {{ btn.dynamicText?.(record) ?? btn.text }}
                      </a-button>
                    </template>
                  </a-popconfirm>
                  <a-button
                    v-else
                    type="link"
                    size="small"
                    :disabled="btn.btnDisabled?.(record)"
                    :class="['p-0 min-w-0', btn.danger ? 'text-rose-500' : '']"
                    @click="btn.handle(record)"
                  >
                    {{ btn.dynamicText?.(record) ?? btn.text }}
                  </a-button>
                </template>
              </template>
            </div>
          </template>
          <!-- 2) 操作列插槽 -->
          <template v-else-if="column.key === actionsKey && $slots.actions">
            <slot name="actions" :record="record" :column="column" :index="index" />
          </template>
          <!-- 3) 自定义 bodyCell 插槽 -->
          <template v-else-if="$slots.bodyCell">
            <slot name="bodyCell" :column="column" :record="record" :index="index" />
          </template>
          <!-- 4) 默认文本 -->
          <template v-else>
            {{ getCellText(record, column) }}
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import { ReloadOutlined, DownloadOutlined, SettingOutlined } from '@ant-design/icons-vue'
import type { Key } from 'ant-design-vue/es/table/interface'
import type { ColumnsType } from 'ant-design-vue/es/table'
import type {
  ProTablePagination,
  ProTableToolItem,
  ProTableBarConfig,
  ProTableColumnExt,
} from './types'

const toolIconMap: Record<ProTableToolItem['icon'], typeof ReloadOutlined> = {
  reload: ReloadOutlined,
  download: DownloadOutlined,
  setting: SettingOutlined,
}

/** 默认操作列的 key，与现有业务中 key: 'actions' 保持一致 */
const ACTIONS_KEY = 'actions'

/** 表体默认固定高度（未测量到容器高度时的回退值，px） */
const DEFAULT_SCROLL_Y_FALLBACK = 400
/** 表头 + 分页占高（px），从容器高度中扣除后得到表体 scroll.y */
const TABLE_HEADER_PAGINATION_OFFSET = 120

interface ProTableProps<RecordType = Record<string, unknown>> {
  /** 列配置，与 a-table columns 一致 */
  columns: ColumnsType<RecordType>
  /** 数据源 */
  dataSource: RecordType[]
  /** 加载态 */
  loading?: boolean
  /** 行 key 字段名或函数 */
  rowKey: string | ((record: RecordType) => Key)
  /** 分页：false 表示不分页（由外部控制）；对象时为受控分页 */
  pagination?: false | ProTablePagination
  /** 横向/纵向滚动，与 a-table scroll 一致 */
  scroll?: { x?: number | string | true; y?: number | string }
  /** 表体固定高度（数字为 px 或如 60vh）；传 0 表示不固定。不传时由组件根据容器高度自动计算填满剩余空间 */
  scrollHeight?: number | string
  /** 操作列 key，用于匹配 bodyCell 中操作列插槽，默认 'actions' */
  actionsKey?: string
  /** 空数据时展示文案，不传则使用 a-table 默认 */
  emptyText?: string
  /** 表格标题（显示时启用卡片头与参考样式）。与 pagination 同时存在且不传 tableBar 时，默认展示「(共 N 条记录) | 刷新 数据最后更新时间」，需监听 @refresh 执行刷新 */
  title?: string
  /** 副标题，如「(共 1,248 个)」；不传时在默认顶栏下自动为「(共 pagination.total 条记录)」 */
  subtitle?: string
  /** 工具栏按钮配置数组；传入时在标题右侧按配置渲染，点击调用该项 handle。与 #toolbar 插槽二选一，插槽优先 */
  toolbar?: ProTableToolItem[]
  /** 顶栏配置；不传时使用默认顶栏（条数 + 刷新 + 数据最后更新时间，由组件根据 loading 维护时间） */
  tableBar?: ProTableBarConfig
}

const props = withDefaults(defineProps<ProTableProps>(), {
  loading: false,
  toolbar: undefined,
  pagination: false,
  scrollHeight: undefined,
  actionsKey: ACTIONS_KEY,
  tableBar: undefined,
})

const hasHeader = computed(() => !!props.title)

/** 有 title 且启用分页时展示默认顶栏（条数 + 刷新 + 数据最后更新时间），无需传 tableBar */
const showDefaultBar = computed(
  () => !!props.title && props.pagination !== false
)

/** 未传 subtitle 时默认展示「(共 N 条记录)」 */
const effectiveSubtitle = computed(() => {
  if (props.subtitle) return props.subtitle
  if (showDefaultBar.value && props.pagination && typeof props.pagination.total === 'number') {
    return `(共 ${props.pagination.total} 条记录)`
  }
  return ''
})

/** 默认顶栏：数据最后更新时间，在 loading 从 true 变为 false 时更新（即加载/刷新完成后） */
const dataLastUpdateTime = ref('')
watch(
  () => props.loading,
  (cur, prev) => {
    if (cur === false && prev === true) {
      dataLastUpdateTime.value = dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
  }
)

const totalLabelText = computed(() => {
  if (!props.tableBar || props.pagination === false) return ''
  const total = props.pagination?.total ?? 0
  const fn = props.tableBar.totalLabel ?? ((n: number) => `共 ${n} 条`)
  return fn(total)
})

/** 有 subtitle 时条数已在标题区展示，顶栏不再重复显示条数文案 */
const showTotalInBar = computed(() => !!totalLabelText.value && !props.subtitle)

/** 右侧工具栏不展示刷新按钮（过滤掉 icon 为 reload 的项） */
const toolbarFiltered = computed(
  () => props.toolbar?.filter((item) => item.icon !== 'reload') ?? []
)

function onBarRefresh() {
  props.tableBar?.onRefresh?.()
}

function getColumnExt(column: Record<string, unknown>): ProTableColumnExt {
  return column as ProTableColumnExt
}

const emit = defineEmits<{
  change: [
    pagination: { current: number; pageSize: number; total: number },
    filters: Record<string, Key[] | null>,
    sorter: unknown,
  ]
  /** 点击顶栏刷新按钮时触发，父组件调用 refresh/loadData 后 loading 结束会更新「数据最后更新时间」 */
  refresh: []
}>()

const tableContainerRef = ref<HTMLElement | null>(null)
/** ResizeObserver 测量得到的表体可用高度（px），用于 scroll.y 以占满剩余空间 */
const measuredScrollY = ref<number>(0)
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  const el = tableContainerRef.value
  if (!el) return
  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) return
    const { height } = entry.contentRect
    const bodyHeight = Math.max(100, Math.floor(height) - TABLE_HEADER_PAGINATION_OFFSET)
    measuredScrollY.value = bodyHeight
  })
  resizeObserver.observe(el)
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

/** 合并 scroll 与 scrollHeight：优先使用测量高度占满剩余空间，否则用 scrollHeight/回退值；传 scrollHeight=0 表示不固定 */
const scroll = computed(() => {
  const base = props.scroll ?? {}
  let y: number | string | undefined
  if (props.scrollHeight === 0 || props.scrollHeight === '0') {
    y = undefined
  } else if (measuredScrollY.value > 0) {
    y = measuredScrollY.value
  } else if (props.scrollHeight != null && props.scrollHeight !== '') {
    y = props.scrollHeight
  } else {
    y = base.y ?? DEFAULT_SCROLL_Y_FALLBACK
  }
  return { ...base, ...(y != null ? { y } : {}) }
})

/** 分页交给 a-table 自带分页：传对象时启用，传 false 时不分页 */
const paginationConfig = computed(() => {
  if (props.pagination === false) return false
  const p = props.pagination
  return {
    current: p.current,
    pageSize: p.pageSize,
    total: p.total,
    showSizeChanger: p.showSizeChanger ?? true,
    showQuickJumper: p.showQuickJumper ?? false,
    onChange: (page: number, pageSize: number) => {
      p.onChange?.(page, pageSize)
    },
  }
})

const locale = computed(() => ({
  emptyText: props.emptyText,
}))

function getCellValue(
  record: Record<string, unknown>,
  column: { dataIndex?: string | string[]; key?: Key }
): unknown {
  const dataIndex = column.dataIndex
  if (dataIndex == null) return undefined
  const key = Array.isArray(dataIndex) ? dataIndex.join('.') : dataIndex
  return record[key as string]
}

function getCellText(
  record: Record<string, unknown>,
  column: { dataIndex?: string | string[]; key?: Key }
): string {
  const value = getCellValue(record, column)
  if (value == null) return ''
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD HH:mm'

function formatCellDate(record: Record<string, unknown>, column: Record<string, unknown>): string {
  const value = getCellValue(record, column as { dataIndex?: string | string[]; key?: Key })
  if (value == null || value === '') return ''
  const ext = column as ProTableColumnExt
  const format = ext.dateFormat ?? DEFAULT_DATE_FORMAT
  const parsed = dayjs(value as string)
  return parsed.isValid() ? parsed.format(format) : String(value)
}

function isStatusActive(record: Record<string, unknown>, column: Record<string, unknown>): boolean {
  const value = getCellValue(record, column as { dataIndex?: string | string[]; key?: Key })
  const ext = column as ProTableColumnExt
  const activeVal = ext.activeValue ?? 'active'
  return String(value) === activeVal
}

function handleTableChange(
  pagination: { current?: number; pageSize?: number; total?: number },
  filters: Record<string, Key[] | null>,
  sorter: unknown
) {
  if (props.pagination !== false && (pagination?.current != null || pagination?.pageSize != null)) {
    props.pagination.onChange?.(
      pagination.current ?? props.pagination.current,
      pagination.pageSize ?? props.pagination.pageSize
    )
  }
  emit(
    'change',
    {
      current: pagination?.current ?? 0,
      pageSize: pagination?.pageSize ?? 10,
      total: pagination?.total ?? 0,
    },
    filters,
    sorter
  )
}
</script>

<style scoped>
/* 仅保留尺寸与布局，明暗由全局主题（Tailwind dark: + ConfigProvider）控制 */
.pro-table-wrapper :deep(.ant-table) {
  font-size: 13px;
}
.pro-table-wrapper :deep(.ant-table-thead > tr > th),
.pro-table-wrapper :deep(.ant-table-tbody > tr > td) {
  padding: 16px 24px;
}
.pro-table-wrapper :deep(.ant-table-thead > tr > th) {
  font-weight: 600;
  font-size: 13px;
}
.pro-table-wrapper :deep(.ant-table-tbody > tr > td) {
  padding: 20px 24px;
}
</style>
