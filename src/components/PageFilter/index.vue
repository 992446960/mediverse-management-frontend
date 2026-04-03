<template>
  <div class="page-filter mt-5" style="background-color: var(--color-bg-container)">
    <a-form ref="formRef" :model="formData" layout="inline">
      <a-row :gutter="[16, 16]" class="w-full">
        <a-col v-for="field in fieldsShownInFilter" :key="field.key" :span="field.col ?? 6">
          <a-form-item :label="field.label" :name="field.key">
            <!-- type === 'input' 或 默认 -->
            <a-input
              v-if="!field.type || field.type === 'input'"
              v-model:value="formData[field.key]"
              :placeholder="field.ph"
              allow-clear
              @change="onChangeFilter"
            >
              <template v-if="field.icon" #prefix>
                <component :is="field.icon" />
              </template>
            </a-input>

            <!-- type === 'select' -->
            <a-select
              v-else-if="field.type === 'select'"
              v-model:value="formData[field.key]"
              :options="field.options"
              :placeholder="field.ph"
              :mode="field.multiple ? 'multiple' : undefined"
              :allow-clear="field.clearable ?? true"
              :show-search="field.filterable"
              @change="onChangeFilter"
            />

            <!-- type === 'date' -->
            <a-date-picker
              v-else-if="field.type === 'date'"
              v-model:value="formData[field.key]"
              :format="field.format ?? 'YYYY-MM-DD'"
              :value-format="field.format ?? 'YYYY-MM-DD'"
              :placeholder="field.ph"
              :disabled-date="field.disabledDate"
              :presets="field.short ? datePresets : undefined"
              class="w-full"
              @change="onChangeFilter"
            />

            <!-- type === 'date-range' -->
            <a-range-picker
              v-else-if="field.type === 'date-range'"
              v-model:value="formData[field.key]"
              :format="field.format ?? 'YYYY-MM-DD'"
              :value-format="field.format ?? 'YYYY-MM-DD'"
              :placeholder="[field.sph ?? t('common.startDate'), field.eph ?? t('common.endDate')]"
              :disabled-date="field.disabledDate"
              :show-time="field.dateType === 'datetimerange'"
              class="w-full"
              @change="onChangeFilter"
            />

            <!-- type === 'number-input' -->
            <NumRange
              v-else-if="field.type === 'number-input'"
              :model-value="getNumRangeValue(field.key)"
              :min-ph="field.minPh"
              :max-ph="field.maxPh"
              :min="field.min"
              :max="field.max"
              @update:model-value="
                (v) => {
                  formData[field.key] = v
                  onChangeFilter()
                }
              "
              @change="onChangeFilter"
            />

            <!-- type === 'slot' -->
            <slot
              v-else-if="field.type === 'slot' && field.slotName"
              :name="field.slotName"
              :form-data="formData"
              :field="field"
              :update-form-data="updateFormData"
            />
          </a-form-item>
        </a-col>

        <!-- 更多筛选按钮 -->
        <a-col v-if="hasMoreFields" :span="2">
          <a-button type="link" @click="onToggleMore">
            {{ moreVisible ? t('common.collapse') : t('common.moreFilters') }}
            <DownOutlined v-if="!moreVisible" />
            <UpOutlined v-else />
          </a-button>
        </a-col>

        <!-- 按钮栏 -->
        <a-col v-if="filterConf.btns?.length" :span="filterConf.btnsCol ?? 6">
          <a-space>
            <a-button
              v-for="(btn, idx) in filterConf.btns"
              :key="idx"
              :type="(btn.type as 'primary' | 'default') ?? 'default'"
              @click="btn.handle?.()"
            >
              <template v-if="btn.icon" #icon>
                <component :is="btn.icon" />
              </template>
              {{ btn.text }}
            </a-button>
          </a-space>
        </a-col>

        <!-- 多行筛选项时：收起为单行 / 展开全部（置于查询等按钮之后） -->
        <a-col v-if="showRowCollapseToggle" :span="2">
          <a-button type="link" class="page-filter__row-toggle" @click="toggleRowLayoutCollapsed">
            {{ rowLayoutCollapsed ? t('common.expand') : t('common.collapse') }}
            <DownOutlined v-if="rowLayoutCollapsed" />
            <UpOutlined v-else />
          </a-button>
        </a-col>
      </a-row>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { DownOutlined, UpOutlined } from '@ant-design/icons-vue'
import NumRange from './slots/NumRange.vue'
import type { FormInstance } from 'ant-design-vue'
import type { PageFilterConfig, PageFilterField } from './types'
import type { PageTableColumnConfig } from '@/components/PageTable/types'

const { t } = useI18n()

const datePresets = computed(() => [
  { label: t('common.today'), value: dayjs() },
  { label: t('common.yesterday'), value: dayjs().subtract(1, 'day') },
  { label: t('common.last7Days'), value: dayjs().subtract(7, 'day') },
  { label: t('common.last30Days'), value: dayjs().subtract(30, 'day') },
])

const GRID_COLS = 24
const ROW_COLLAPSE_TOGGLE_SPAN = 2
const MORE_FILTER_BTN_SPAN = 2

const props = withDefaults(
  defineProps<{
    filterConf: PageFilterConfig
    tableColumns?: PageTableColumnConfig[]
    /** 筛选项按 24 栅格占多行时，是否显示「收起为单行 / 展开」 */
    enableLayoutRowCollapse?: boolean
  }>(),
  {
    tableColumns: () => [],
    enableLayoutRowCollapse: true,
  }
)

const emit = defineEmits<{
  'fetch-table-data': []
  'on-more-visible-change': []
  /** 机构 id 变化时触发（用于父组件按机构加载科室列表） */
  'org-id-change': [value: string]
}>()

const formRef = ref<FormInstance | null>(null)
const moreVisible = ref(false)
const formData = reactive<Record<string, unknown>>({})

// 初始化 formData
watch(
  () => props.filterConf.filterForm,
  (form) => {
    for (const f of form) {
      if (f.key && !(f.key in formData) && f.defaultValue !== undefined) {
        formData[f.key] = f.defaultValue
      }
    }
  },
  { immediate: true }
)

const hasOrgIdField = computed(() =>
  (props.filterConf.filterForm ?? []).some((f) => f.key === 'org_id')
)
watch(
  () => (hasOrgIdField.value ? formData.org_id : undefined),
  (val) => {
    if (hasOrgIdField.value) emit('org-id-change', (val as string) ?? '')
  },
  { immediate: true }
)

function updateFormData(key: string, value: unknown) {
  formData[key] = value
  emit('fetch-table-data')
}

const visibleFields = computed<PageFilterField[]>(() => {
  const form = props.filterConf.filterForm ?? []
  const cols = props.tableColumns ?? []
  return form.filter((f) => {
    if (f.hide) return false
    if (f.tableLink) {
      const col = cols.find((c) => c.prop === f.tableLink || c._id === f.tableLink)
      if (col && col._visible === false) return false
    }
    if (f._usual === false && !moreVisible.value) return false
    return true
  })
})

const hasMoreFields = computed(() =>
  (props.filterConf.filterForm ?? []).some((f) => f._usual === false)
)

function countRowsFromSpans(spans: number[]): number {
  let sum = 0
  let rows = 1
  for (const span of spans) {
    if (sum + span > GRID_COLS) {
      rows++
      sum = span
    } else {
      sum += span
    }
  }
  return rows
}

/** 不含「单行收起」按钮时，字段 + 更多 + 操作钮占用的栅格行数 */
const filterLayoutRowCount = computed(() => {
  const spans = visibleFields.value.map((f) => f.col ?? 6)
  if (hasMoreFields.value) spans.push(MORE_FILTER_BTN_SPAN)
  if (props.filterConf.btns?.length) spans.push(props.filterConf.btnsCol ?? 6)
  return countRowsFromSpans(spans)
})

const showRowCollapseToggle = computed(
  () => props.enableLayoutRowCollapse && filterLayoutRowCount.value >= 2
)

const rowLayoutCollapsed = ref(false)

watch(showRowCollapseToggle, (ok) => {
  if (!ok) rowLayoutCollapsed.value = false
})

/** 尾部固定占位：更多筛选 + 查询等按钮 + 单行切换（与模板列顺序一致） */
const tailReservedSpans = computed(() => {
  let n = 0
  if (hasMoreFields.value) n += MORE_FILTER_BTN_SPAN
  if (props.filterConf.btns?.length) n += props.filterConf.btnsCol ?? 6
  if (showRowCollapseToggle.value) n += ROW_COLLAPSE_TOGGLE_SPAN
  return n
})

const fieldsShownInFilter = computed<PageFilterField[]>(() => {
  if (!showRowCollapseToggle.value || !rowLayoutCollapsed.value) {
    return visibleFields.value
  }
  let budget = Math.max(0, GRID_COLS - tailReservedSpans.value)
  const out: PageFilterField[] = []
  for (const f of visibleFields.value) {
    const span = f.col ?? 6
    if (out.length === 0 && span > budget) {
      out.push(f)
      break
    }
    if (span <= budget) {
      out.push(f)
      budget -= span
    } else {
      break
    }
  }
  return out
})

function toggleRowLayoutCollapsed() {
  rowLayoutCollapsed.value = !rowLayoutCollapsed.value
}

const filteParams = computed<Record<string, unknown>>(() => {
  const params: Record<string, unknown> = {}
  const keys = new Set(visibleFields.value.map((f) => f.key))
  for (const k of keys) {
    const v = formData[k]
    if (v !== '' && v != null && v !== undefined) {
      params[k] = v
    }
  }
  return params
})

function getNumRangeValue(key: string): { min?: number; max?: number } | null | undefined {
  const v = formData[key]
  return v as { min?: number; max?: number } | null | undefined
}

function onChangeFilter() {
  emit('fetch-table-data')
}

function onToggleMore() {
  moreVisible.value = !moreVisible.value
  emit('on-more-visible-change')
}

function filterFormReset(data?: Record<string, unknown>) {
  if (data) {
    Object.keys(formData).forEach((k) => delete formData[k])
    Object.assign(formData, data)
  } else {
    formRef.value?.resetFields()
    // 重置 NumRange 等自定义子组件的值
    for (const f of props.filterConf.filterForm) {
      if (f.type === 'number-input' && f.key) {
        formData[f.key] = undefined
      }
    }
  }
}

/** 仅更新单个筛选项（如机构变化时清空科室） */
function setFilterField(key: string, value: unknown) {
  if (key in formData) {
    formData[key] = value
  }
}

defineExpose({
  filterFormReset,
  filteParams,
  setFilterField,
})
</script>

<style scoped lang="scss">
.page-filter :deep(.ant-form-item) {
  margin-bottom: 16px;
  .ant-form-item-row {
    flex-wrap: nowrap;
  }
  .ant-form-item-label {
    flex-shrink: 0;
  }
}
</style>
