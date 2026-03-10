<template>
  <div class="page-filter mt-5" style="background-color: var(--color-bg-container)">
    <a-form ref="formRef" :model="formData" layout="inline">
      <a-row :gutter="[16, 16]" class="w-full">
        <a-col
          v-for="field in visibleFields"
          :key="field.key"
          :span="field.col ?? 6"
        >
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
              :placeholder="[field.sph ?? '开始日期', field.eph ?? '结束日期']"
              :disabled-date="field.disabledDate"
              :show-time="field.dateType === 'datetimerange'"
              class="w-full"
              @change="onChangeFilter"
            />

            <!-- type === 'number-input' -->
            <NumRange
              v-else-if="field.type === 'number-input'"
              :model-value="(formData[field.key] as { min?: number; max?: number } | null | undefined)"
              :min-ph="field.minPh"
              :max-ph="field.maxPh"
              :min="field.min"
              :max="field.max"
              @update:model-value="(v) => { formData[field.key] = v; onChangeFilter() }"
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
            {{ moreVisible ? '收起' : '更多筛选' }}
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
      </a-row>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import dayjs from 'dayjs'
import { DownOutlined, UpOutlined } from '@ant-design/icons-vue'
import NumRange from './slots/NumRange.vue'
import type { FormInstance } from 'ant-design-vue'
import type { PageFilterConfig, PageFilterField } from './types'
import type { PageTableColumnConfig } from '@/components/PageTable/types'

const datePresets = [
  { label: '今天', value: dayjs() },
  { label: '昨天', value: dayjs().subtract(1, 'day') },
  { label: '最近7天', value: dayjs().subtract(7, 'day') },
  { label: '最近30天', value: dayjs().subtract(30, 'day') },
]

const props = withDefaults(
  defineProps<{
    filterConf: PageFilterConfig
    tableColumns?: PageTableColumnConfig[]
  }>(),
  {
    tableColumns: () => [],
  }
)

const emit = defineEmits<{
  'fetch-table-data': []
  'on-more-visible-change': []
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
      const col = cols.find(
        (c) => c.prop === f.tableLink || c._id === f.tableLink
      )
      if (col && col._visible === false) return false
    }
    if (f._usual === false && !moreVisible.value) return false
    return true
  })
})

const hasMoreFields = computed(() =>
  (props.filterConf.filterForm ?? []).some((f) => f._usual === false)
)

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

defineExpose({
  filterFormReset,
  filteParams,
})
</script>

<style scoped>
.page-filter :deep(.ant-form-item) {
  margin-bottom: 16px;
}
</style>
