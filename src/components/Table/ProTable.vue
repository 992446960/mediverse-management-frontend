<template>
  <div
    class="pro-table-wrapper rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col"
    :class="{ 'pro-table-card': hasHeader }"
  >
    <!-- 顶栏：标题 + 条数/更新时间 + 工具栏 -->
    <template v-if="hasHeader">
      <div
        class="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0"
      >
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-sm font-bold text-slate-800 dark:text-slate-100">{{ title }}</span>
          <span v-if="subtitle" class="text-xs text-slate-400">{{ subtitle }}</span>
          <template v-if="tableBar && !tableBar.hide && (tableBar.updateTime || totalLabelText)">
            <span class="text-slate-300 dark:text-slate-600">|</span>
            <span v-if="totalLabelText" class="text-xs text-slate-500">{{ totalLabelText }}</span>
            <span
              v-if="tableBar.updateTime"
              class="text-xs text-slate-400"
              :title="tableBar.updateTime"
            >
              更新：{{ tableBar.updateTime }}
            </span>
          </template>
        </div>
        <div v-if="$slots.toolbar || (toolbar && toolbar.length)" class="flex items-center gap-2">
          <template v-if="$slots.toolbar">
            <slot name="toolbar" />
          </template>
          <template v-else-if="toolbar?.length">
            <button
              v-for="item in toolbar"
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
    <div class="flex-1 overflow-hidden min-h-0">
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
import { computed } from 'vue'
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

/** 表体默认固定高度（px），用于表格内滚动，不设则不固定高度 */
const DEFAULT_SCROLL_Y = 400

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
  /** 表体固定高度（数字为 px），表格在内部滚动；不传时使用默认 400，传 0 表示不固定 */
  scrollHeight?: number | string
  /** 操作列 key，用于匹配 bodyCell 中操作列插槽，默认 'actions' */
  actionsKey?: string
  /** 空数据时展示文案，不传则使用 a-table 默认 */
  emptyText?: string
  /** 表格标题（显示时启用卡片头与参考样式） */
  title?: string
  /** 副标题，如「(共 1,248 个)」 */
  subtitle?: string
  /** 工具栏按钮配置数组；传入时在标题右侧按配置渲染，点击调用该项 handle。与 #toolbar 插槽二选一，插槽优先 */
  toolbar?: ProTableToolItem[]
  /** 顶栏配置：条数/更新时间等，数据驱动展示 */
  tableBar?: ProTableBarConfig
}

const props = withDefaults(defineProps<ProTableProps>(), {
  loading: false,
  toolbar: undefined,
  pagination: false,
  scrollHeight: DEFAULT_SCROLL_Y,
  actionsKey: ACTIONS_KEY,
  tableBar: undefined,
})

const hasHeader = computed(() => !!props.title)

const totalLabelText = computed(() => {
  if (!props.tableBar || props.pagination === false) return ''
  const total = props.pagination?.total ?? 0
  const fn = props.tableBar.totalLabel ?? ((n: number) => `共 ${n} 条`)
  return fn(total)
})

function getColumnExt(column: Record<string, unknown>): ProTableColumnExt {
  return column as ProTableColumnExt
}

const emit = defineEmits<{
  change: [
    pagination: { current: number; pageSize: number; total: number },
    filters: Record<string, Key[] | null>,
    sorter: unknown,
  ]
}>()

/** 合并 scroll 与 scrollHeight：固定表体高度，在表格内滚动 */
const scroll = computed(() => {
  const base = props.scroll ?? {}
  const y =
    props.scrollHeight === 0 || props.scrollHeight === '0'
      ? undefined
      : (props.scrollHeight ?? base.y)
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
