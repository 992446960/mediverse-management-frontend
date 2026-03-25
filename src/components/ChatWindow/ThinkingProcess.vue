<script setup lang="ts">
import { ref, computed } from 'vue'
import { RobotOutlined, DownOutlined, CheckOutlined } from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import type { ThinkingProcessStep } from '@/types/chat'
import { renderMarkdownSafe } from '@/utils/renderMarkdownSafe'

const { t } = useI18n()

const props = defineProps<{
  steps: ThinkingProcessStep[]
}>()

const expanded = ref(true)

/** 每步说明是否展开，缺省为 true（与改前一致）；仅含 description 的步骤可收起 */
const stepDescExpandedByIndex = ref<Record<number, boolean>>({})

function isStepDescExpanded(idx: number): boolean {
  return stepDescExpandedByIndex.value[idx] !== false
}

function toggleStepDesc(idx: number) {
  const next = !isStepDescExpanded(idx)
  stepDescExpandedByIndex.value = { ...stepDescExpandedByIndex.value, [idx]: next }
}

function formatDuration(step: ThinkingProcessStep): string | undefined {
  if (step.duration_ms !== undefined) {
    const s = step.duration_ms / 1000
    return s >= 1 ? `${s.toFixed(1)}s` : `${(s * 1000).toFixed(0)}ms`
  }
  return step.duration
}

const displaySteps = computed(() =>
  props.steps.map((step) => ({
    ...step,
    extra: formatDuration(step),
    descriptionHtml: step.description ? renderMarkdownSafe(step.description) : '',
  }))
)
</script>

<template>
  <div class="thinking-process">
    <!-- 可折叠标题：机器人图标 + 思考过程 + 箭头 -->
    <button type="button" class="thinking-process-header" @click="expanded = !expanded">
      <RobotOutlined class="thinking-process-header-icon" />
      <span class="thinking-process-header-text">{{ t('chat.thinkingProcessTitle') }}</span>
      <DownOutlined
        class="thinking-process-header-chevron"
        :class="{ 'thinking-process-header-chevron--collapsed': !expanded }"
      />
    </button>

    <!-- 步骤容器：白底、圆角、边框 -->
    <div v-show="expanded" class="thinking-process-box">
      <div v-for="(step, idx) in displaySteps" :key="idx" class="thinking-process-step">
        <div class="thinking-process-step-icon">
          <span
            class="thinking-process-step-dot"
            :class="{ 'thinking-process-step-dot--done': step.status === 'done' }"
          >
            <CheckOutlined v-if="step.status === 'done'" />
            <span v-else class="thinking-process-step-dot-loading" />
          </span>
          <span v-if="idx < displaySteps.length - 1" class="thinking-process-step-line" />
        </div>
        <div class="thinking-process-step-content">
          <div class="thinking-process-step-title-row">
            <div class="thinking-process-step-title">{{ step.title }}</div>
            <span v-if="step.extra" class="thinking-process-step-badge">{{ step.extra }}</span>
            <span
              v-if="step.description"
              class="thinking-process-step-title-row-spacer"
              aria-hidden="true"
            />
            <button
              v-if="step.description"
              type="button"
              class="thinking-process-step-detail-toggle"
              :aria-expanded="isStepDescExpanded(idx)"
              :aria-label="
                isStepDescExpanded(idx)
                  ? t('chat.thinkingProcessStepDetailCollapse')
                  : t('chat.thinkingProcessStepDetailExpand')
              "
              @click.stop="toggleStepDesc(idx)"
            >
              <DownOutlined
                class="thinking-process-step-detail-chevron"
                :class="{
                  'thinking-process-step-detail-chevron--collapsed': !isStepDescExpanded(idx),
                }"
              />
            </button>
          </div>
          <!-- eslint-disable-next-line vue/no-v-html -- Markdown（marked + DOMPurify），来源为思考步骤接口 -->
          <div
            v-show="step.description && isStepDescExpanded(idx)"
            class="thinking-process-step-desc markdown-body prose prose-sm max-w-none dark:prose-invert"
            v-html="step.descriptionHtml"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.thinking-process {
  --tp-border: var(--color-border);
  --tp-success: var(--color-success);
}

.thinking-process-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 0;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 22px;
}

.thinking-process-header:hover {
  color: var(--color-primary);
}

.thinking-process-header-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
  line-height: 1;
  color: var(--color-primary);
}

.thinking-process-header-text {
  flex: 1;
  text-align: left;
}

.thinking-process-header-chevron {
  font-size: 12px;
  transition: transform 0.2s ease;
}

.thinking-process-header-chevron--collapsed {
  transform: rotate(-90deg);
}

.thinking-process-box {
  border: 1px solid var(--tp-border);
  border-radius: 10px;
  background: var(--color-bg-container);
  padding: 16px;
}

.thinking-process-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  position: relative;
}

/* 用 padding 替代 margin，便于时间轴竖线在列内延伸到下一步圆点（绝对定位图标列可拉高到底） */
.thinking-process-step:not(:last-child) {
  padding-bottom: 16px;
}

.thinking-process-step-icon {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 16px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* 16px 圆点与标题行（约 22px 行高）视觉中线对齐 */
  padding-top: 3px;
  box-sizing: border-box;
}

/* 下一步圆点同样有 padding-top: 3px，时间轴略微下探避免竖线与圆点「断开」 */
.thinking-process-step:not(:last-child) .thinking-process-step-icon {
  bottom: -3px;
}

.thinking-process-step-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-border);
  color: white;
  font-size: 12px;
}

.thinking-process-step-dot--done {
  background: var(--color-primary);
}

.thinking-process-step-dot-loading {
  width: 8px;
  height: 8px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: thinking-process-spin 0.8s linear infinite;
}

@keyframes thinking-process-spin {
  to {
    transform: rotate(360deg);
  }
}

.thinking-process-step-line {
  flex: 1;
  width: 2px;
  min-height: 0;
  margin-top: 0;
  background: var(--tp-border);
}

.thinking-process-step-content {
  flex: 1;
  min-width: 0;
  margin-left: 28px;
}

.thinking-process-step-title-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.thinking-process-step-title {
  flex: 0 1 auto;
  min-width: 0;
  font-weight: 600;
  color: var(--color-text-base);
  font-size: 14px;
  line-height: 22px;
}

.thinking-process-step-title-row-spacer {
  flex: 1;
  min-width: 8px;
}

.thinking-process-step-detail-toggle {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  margin-top: 1px;
  padding: 2px;
  border: none;
  border-radius: 4px;
  background: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  line-height: 1;
}

.thinking-process-step-detail-toggle:hover {
  color: var(--color-primary);
  background: var(--color-fill-tertiary);
}

.thinking-process-step-detail-chevron {
  font-size: 12px;
  transition: transform 0.2s ease;
}

.thinking-process-step-detail-chevron--collapsed {
  transform: rotate(-90deg);
}

.thinking-process-step-desc {
  margin-top: 4px;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.thinking-process-step-desc :deep(p) {
  margin: 0.35em 0;
}

.thinking-process-step-desc :deep(p:first-child) {
  margin-top: 0;
}

.thinking-process-step-desc :deep(p:last-child) {
  margin-bottom: 0;
}

.thinking-process-step-desc :deep(pre) {
  background-color: var(--color-bg-layout);
  padding: 10px 12px;
  border-radius: 6px;
  overflow: auto;
  font-size: 12px;
}

.thinking-process-step-desc :deep(code) {
  font-size: 0.92em;
}

.thinking-process-step-badge {
  display: inline-block;
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 2px;
  padding: 2px 8px;
  font-size: 12px;
  line-height: 1.25;
  color: var(--color-text-secondary);
  background: var(--color-bg-layout);
  border-radius: 999px;
}
</style>
