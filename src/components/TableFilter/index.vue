<template>
  <div class="table-filter  app-container">
    <!-- 可选标题区：标题 + 主操作按钮 -->
    <div v-if="title || primaryAction" class="table-filter__header">
      <h2 v-if="title" class="table-filter__title">{{ title }}</h2>
      <a-button
        v-if="primaryAction"
        v-permission="primaryAction.permission ?? []"
        type="primary"
        class="table-filter__header-btn"
        @click="emit('primary-action')"
      >
        <template v-if="$slots.primaryActionIcon" #icon>
          <slot name="primaryActionIcon" />
        </template>
        {{ primaryAction.text }}
      </a-button>
    </div>
    <!-- 筛选项 + 搜索/重置 -->
    <a-space
      wrap
      :size="24"
      align="center"
      :class="{ 'table-filter__body--with-header': title || primaryAction }"
    >
      <template v-for="field in fields" :key="field.key">
        <a-space align="center" :size="12">
          <span class="table-filter__label">{{ field.label }}</span>
          <template v-if="field.type === 'input'">
            <a-input
              :value="String(modelValue[field.key] ?? '')"
              :placeholder="field.placeholder ?? ''"
              :class="field.inputClass ?? 'table-filter__input-default'"
              allow-clear
              @update:value="onInput(field.key, $event)"
              @keydown.enter="emit('search')"
            />
          </template>
          <template v-else-if="field.type === 'select'">
            <a-select
              :value="modelValue[field.key]"
              :placeholder="field.placeholder"
              :class="field.inputClass"
              :options="selectOptions(field)"
              allow-clear
              style="min-width: 140px"
              @update:value="onSelectChange(field.key, $event)"
            />
          </template>
        </a-space>
      </template>
      <a-space :size="8">
        <a-button type="primary" class="table-filter__btn" @click="emit('search')">
          <template #icon>
            <SearchOutlined />
          </template>
          {{ searchText }}
        </a-button>
        <a-button class="table-filter__btn" @click="onReset">
          <template #icon>
            <ReloadOutlined />
          </template>
          {{ resetText }}
        </a-button>
      </a-space>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import type { TableFilterFieldConfig, TableFilterOption, TableFilterPrimaryAction } from './types'

interface Props {
  /** 筛选项配置 */
  fields: TableFilterFieldConfig[]
  /** 当前筛选值（v-model） */
  modelValue: Record<string, string | number | undefined>
  /** 搜索按钮文案 */
  searchText?: string
  /** 重置按钮文案 */
  resetText?: string
  /** 可选：标题区文案（如「科室管理」） */
  title?: string
  /** 可选：标题区主操作按钮配置（如「新增科室」），点击触发 primary-action */
  primaryAction?: TableFilterPrimaryAction
}

const props = withDefaults(defineProps<Props>(), {
  searchText: '搜索',
  resetText: '重置',
  title: undefined,
  primaryAction: undefined,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, string | number | undefined>): void
  (e: 'search'): void
  (e: 'reset'): void
  (e: 'primary-action'): void
}>()

/** 将 TableFilterOption[] 转为 a-select options 格式 */
function selectOptions(field: TableFilterFieldConfig): { label: string; value: string | number }[] {
  if (!field.options?.length) return []
  return field.options.map((opt: TableFilterOption) => ({
    label: opt.label,
    value: opt.value,
  }))
}

function onInput(key: string, value: string) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function onSelectChange(key: string, value: string | number | undefined) {
  if (value === undefined) {
    emit('update:modelValue', { ...props.modelValue, [key]: undefined })
  } else {
    const opt = props.fields
      .find(f => f.key === key)
      ?.options?.find(o => o.value === value || String(o.value) === String(value))
    emit('update:modelValue', { ...props.modelValue, [key]: opt?.value ?? value })
  }
  emit('search')
}

function onReset() {
  const initial: Record<string, string | number | undefined> = {}
  for (const f of props.fields) {
    if (f.type === 'select' && f.options?.length) {
      const first = f.options[0]
      initial[f.key] = first?.value
    }
    else {
      initial[f.key] = undefined
    }
  }
  emit('update:modelValue', initial)
  emit('reset')
}
</script>

<style scoped>
.table-filter{
  background-color: var(--color-bg-container);
  padding-bottom: calc(var(--spacing-xl) + 24px);
}
.table-filter__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.table-filter__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--ant-color-text);
}

/* 按钮内 icon 与文字垂直居中对齐 */
.table-filter__header-btn,
.table-filter__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.table-filter__header-btn :deep(.anticon),
.table-filter__btn :deep(.anticon) {
  display: inline-flex;
  align-items: center;
  margin-inline-end: 0;
}

.table-filter__header-btn :deep(.anticon) {
  font-size: 16px;
}

.table-filter__body--with-header {
  margin-bottom: 0;
}

.table-filter__label {
  font-size: 14px;
  color: var(--ant-color-text-secondary);
  white-space: nowrap;
}

.table-filter__input-default {
  width: 256px; /* w-64 */
}
</style>
