<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ToolOutlined, CaretRightOutlined, CaretDownOutlined } from '@ant-design/icons-vue'
import type { ToolCall } from '@/types/chat'

const { t } = useI18n()

const props = defineProps<{
  toolCalls: ToolCall[]
}>()

const expanded = ref<Record<number, boolean>>({})

/** 是否有可展开的参数/结果详情（旧接口或 Mock 带 args/result） */
function hasExpandableDetail(call: ToolCall): boolean {
  const argsKeys = call.args && typeof call.args === 'object' ? Object.keys(call.args) : []
  const resultKeys = call.result && typeof call.result === 'object' ? Object.keys(call.result) : []
  return argsKeys.length > 0 || resultKeys.length > 0
}

/** 主标题：优先 title，其次兼容 skill_description / skill_name */
function displayTitle(call: ToolCall): string {
  return (
    call.title ||
    call.skill_description ||
    call.skill_name ||
    call.name ||
    t('chat.toolCallFallbackTitle')
  )
}

/** 工具标识：优先 name */
function displayIdentifier(call: ToolCall): string {
  return call.name || call.skill_name || ''
}

const summarizeJson = (obj?: Record<string, unknown>): string => {
  if (!obj || typeof obj !== 'object') return ''
  const keys = Object.keys(obj).slice(0, 5)
  if (keys.length === 0) return ''
  return keys.map((k) => `${k}: ${JSON.stringify((obj as Record<string, unknown>)[k])}`).join(', ')
}

type GroupedRow = { call: ToolCall; count: number; indices: number[] }

/** 连续相同 name+title 的条目合并为一次「调用次数」展示 */
const groupedCalls = computed(() => {
  const list = props.toolCalls
  const rows: GroupedRow[] = []
  for (let i = 0; i < list.length; i++) {
    const call = list[i]!
    const id = `${displayIdentifier(call)}|||${displayTitle(call)}`
    const prev = rows[rows.length - 1]
    if (
      prev &&
      `${displayIdentifier(prev.call)}|||${displayTitle(prev.call)}` === id &&
      !hasExpandableDetail(call) &&
      !hasExpandableDetail(prev.call)
    ) {
      prev.count += 1
      prev.indices.push(i)
    } else {
      rows.push({ call, count: 1, indices: [i] })
    }
  }
  return rows
})

function rowExpandedKey(indices: number[]): boolean {
  return indices.some((i) => expanded.value[i])
}

function toggleRow(indices: number[]) {
  const next = !rowExpandedKey(indices)
  for (const i of indices) {
    expanded.value[i] = next
  }
}

function onHeadClick(row: GroupedRow) {
  if (hasExpandableDetail(row.call)) toggleRow(row.indices)
}

function jsonForRow(call: ToolCall): { argsLine: string; resultLine: string } {
  return {
    argsLine: summarizeJson(call.args),
    resultLine: summarizeJson(call.result),
  }
}
</script>

<template>
  <div class="skill-call-display flex flex-col gap-2 my-2">
    <div class="skill-call-display__label text-xs font-medium text-[var(--color-text-secondary)]">
      {{ t('chat.toolCallsSection') }}
    </div>
    <div class="skill-call-display__list flex flex-col gap-2">
      <div
        v-for="(row, rowIndex) in groupedCalls"
        :key="`${displayIdentifier(row.call)}-${rowIndex}`"
        class="skill-call-card rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-layout)]/80 overflow-hidden"
      >
        <div
          class="skill-call-card__head flex items-center gap-2 px-3 py-2.5 transition-colors select-none"
          :class="
            hasExpandableDetail(row.call)
              ? 'cursor-pointer hover:bg-[var(--color-border-secondary)]'
              : ''
          "
          :role="hasExpandableDetail(row.call) ? 'button' : undefined"
          :tabindex="hasExpandableDetail(row.call) ? 0 : undefined"
          @click="onHeadClick(row)"
          @keydown.enter.prevent="onHeadClick(row)"
          @keydown.space.prevent="onHeadClick(row)"
        >
          <span
            class="skill-call-card__icon-wrap flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-base)]"
          >
            <ToolOutlined class="text-sm" />
          </span>
          <div class="min-w-0 flex-1 flex flex-col gap-0.5">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span class="text-sm font-medium text-[var(--color-text-base)] leading-snug">
                {{ displayTitle(row.call) }}
              </span>
              <a-tag v-if="row.count > 1" class="m-0 text-xs" :bordered="true">
                {{ t('chat.toolCallInvokedTimes', { n: row.count }) }}
              </a-tag>
            </div>
            <span
              v-if="row.call.duration_ms != null"
              class="text-xs text-[var(--color-text-tertiary)]"
            >
              {{ t('chat.skillCallDuration') }}: {{ row.call.duration_ms }}ms
            </span>
          </div>
          <template v-if="hasExpandableDetail(row.call)">
            <CaretDownOutlined
              v-if="rowExpandedKey(row.indices)"
              class="text-xs text-[var(--color-text-tertiary)] shrink-0"
            />
            <CaretRightOutlined v-else class="text-xs text-[var(--color-text-tertiary)] shrink-0" />
          </template>
        </div>

        <div
          v-if="hasExpandableDetail(row.call) && rowExpandedKey(row.indices)"
          class="skill-call-card__detail px-3 py-2.5 text-xs space-y-2 border-t border-[var(--color-border)] bg-[var(--color-bg-container)]/70"
        >
          <div v-if="jsonForRow(row.call).argsLine">
            <span class="font-medium text-[var(--color-text-secondary)]">{{
              t('chat.skillCallArgs')
            }}</span>
            <span class="block font-mono text-[var(--color-text-tertiary)] break-all mt-1">{{
              jsonForRow(row.call).argsLine
            }}</span>
          </div>
          <div v-if="jsonForRow(row.call).resultLine">
            <span class="font-medium text-[var(--color-text-secondary)]">{{
              t('chat.skillCallResult')
            }}</span>
            <span class="block font-mono text-[var(--color-text-tertiary)] break-all mt-1">{{
              jsonForRow(row.call).resultLine
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skill-call-display__label {
  letter-spacing: 0.02em;
}

.skill-call-card__icon-wrap {
  background: color-mix(in srgb, var(--color-primary) 14%, var(--color-bg-container));
  color: var(--color-primary);
  border: 1px solid color-mix(in srgb, var(--color-primary) 22%, var(--color-border));
}
</style>
