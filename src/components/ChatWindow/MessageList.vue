<script setup lang="ts">
import { h, computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { BubbleList } from 'ant-design-x-vue'
import BubbleRenderer from './BubbleRenderer.vue'
import ThinkingProcess from './ThinkingProcess.vue'
import SourceCitation from './SourceCitation.vue'
import type { Message, MessagePart } from '@/types/chat'
import { isImagePart, isPdfPart } from '@/types/chat'
import { getMessageText } from '@/types/chat'
import {
  UserOutlined,
  RobotOutlined,
  FileOutlined,
  FilePdfOutlined,
  VerticalAlignBottomOutlined,
  CopyOutlined,
} from '@ant-design/icons-vue'
import { message as antMessage } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    messages: Message[]
    loading?: boolean
    streaming?: boolean
    sessionId?: string | null
  }>(),
  { streaming: false }
)

const listContainerRef = ref<HTMLElement | null>(null)
const bottomAnchorRef = ref<HTMLElement | null>(null)
const shouldAutoScroll = ref(true)
const showScrollToBottom = ref(false)
let scrollTimeout: ReturnType<typeof setTimeout> | null = null
const mountScrollTimeouts: ReturnType<typeof setTimeout>[] = []

const NEAR_BOTTOM_THRESHOLD = 80
const SCROLL_DEBOUNCE_MS = 50

function getFileParts(msg: Message): MessagePart[] {
  return msg.parts?.filter((p) => p.type === 'file' || p.type === 'image') ?? []
}

/** 文件名中间省略，保留扩展名（参考图 2） */
function truncateFilename(str: string, maxLen = 32): string {
  if (!str || str.length <= maxLen) return str
  const extIdx = str.lastIndexOf('.')
  const ext = extIdx >= 0 ? str.slice(extIdx) : ''
  const namePart = extIdx >= 0 ? str.slice(0, extIdx) : str
  const maxName = maxLen - ext.length - 3
  if (maxName <= 0) return str.slice(0, maxLen - 3) + '...' + ext
  const take = Math.floor(maxName / 2)
  return namePart.slice(0, take) + '...' + namePart.slice(-(maxName - take)) + ext
}

/** 过滤稀疏数组中的空位，避免 ThinkingProcess 收到 undefined 导致渲染异常 */
function getThinkingProcess(
  steps: Message['thinking_process']
): NonNullable<Message['thinking_process']> {
  return (steps ?? []).filter(Boolean) as NonNullable<Message['thinking_process']>
}

const items = computed(() => {
  return props.messages.map((msg) => ({
    key: msg.id,
    role: msg.role,
    content: getMessageText(msg),
    fileParts: getFileParts(msg),
    thinking_process: getThinkingProcess(msg.thinking_process),
    tool_calls: msg.tool_calls,
    citations: msg.citations,
    status: msg.status,
    loading: msg.status === 'streaming',
    // 仅正在流式输出的消息显示打字效果，历史记录直接展示完整内容
    typing: msg.status === 'streaming' ? { step: 5, interval: 20 } : false,
    avatar: msg.role === 'user' ? { icon: h(UserOutlined) } : { icon: h(RobotOutlined) },
  }))
})

function isNearBottom(el: HTMLElement | null): boolean {
  if (!el) return true
  return el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_THRESHOLD
}

/**
 * 滚动到底部：使用 scrollIntoView 锚点，不依赖具体滚动容器
 * - scrollToBottom(): 流式追加时防抖
 * - scrollToBottom(true): 完成态/切换会话时立即滚动
 */
function scrollToBottom(immediate = false) {
  if (!immediate && !shouldAutoScroll.value) return

  const doScroll = () => {
    bottomAnchorRef.value?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }

  if (immediate) {
    doScroll()
    return
  }

  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    scrollTimeout = null
    doScroll()
  }, SCROLL_DEBOUNCE_MS)
}

/** BubbleList onScroll：同步用户是否在底部，控制是否自动滚动 */
function handleScroll(ev: Event) {
  const el = ev.target as HTMLElement
  const near = isNearBottom(el)
  shouldAutoScroll.value = near
  showScrollToBottom.value = !near
}

function goToBottom() {
  shouldAutoScroll.value = true
  showScrollToBottom.value = false
  nextTick(() => scrollToBottom(true))
}

// 若实际滚动容器为外层 listContainerRef，需监听其 scroll（BubbleList 的 onScroll 覆盖其内部容器）
onMounted(() => {
  const el = listContainerRef.value
  if (el) el.addEventListener('scroll', handleScroll, { passive: true })
  // 进入有记录的聊天时，挂载后多次尝试滚动到底部（含切换会话、刷新）
  if (props.messages.length > 0) {
    nextTick(() => scrollToBottom(true))
    ;[100, 200, 400].forEach((ms) => {
      mountScrollTimeouts.push(setTimeout(() => scrollToBottom(true), ms))
    })
  }
})

onUnmounted(() => {
  const el = listContainerRef.value
  if (el) el.removeEventListener('scroll', handleScroll)
  if (scrollTimeout) clearTimeout(scrollTimeout)
  mountScrollTimeouts.splice(0).forEach(clearTimeout)
})

// 切换会话时立即滚动到底部
watch(
  () => props.sessionId,
  (newId, oldId) => {
    if (newId !== oldId) {
      shouldAutoScroll.value = true
      showScrollToBottom.value = false
      nextTick(() => scrollToBottom(true))
    }
  }
)

// 消息变化：流式用防抖，完成态/初始加载用立即滚动
watch(
  () => props.messages,
  (messages, oldMessages) => {
    const last = messages[messages.length - 1]
    const oldLast = oldMessages?.[oldMessages.length - 1]
    const justFinished = last?.status !== 'streaming' && oldLast?.status === 'streaming'
    const isInitialLoad = messages.length > 0 && (!oldMessages?.length || oldMessages.length === 0)
    const immediate = justFinished || isInitialLoad
    nextTick(() => {
      scrollToBottom(immediate)
      // 初始加载时 DOM 可能未完全布局，延迟再滚一次确保到底部
      if (isInitialLoad) {
        setTimeout(() => scrollToBottom(true), 100)
      }
    })
  },
  { deep: true }
)

async function copyMessageContent(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    antMessage.success(t('common.copied'))
  } catch {
    antMessage.error(t('common.copyFailed'))
  }
}

const roles = {
  user: {
    placement: 'end' as const,
    variant: 'shadow' as const,
    avatar: { icon: h(UserOutlined), style: { backgroundColor: '#87d068' } },
  },
  assistant: {
    placement: 'start' as const,
    variant: 'outlined' as const,
    avatar: { icon: h(RobotOutlined), style: { backgroundColor: '#1890ff' } },
    // typing 由 items 中按 msg.status 控制，历史记录不显示打字效果
  },
}
</script>

<template>
  <div class="message-list-wrapper relative h-full pb-4">
    <div ref="listContainerRef" class="message-list h-full overflow-y-auto p-4 pb-0">
      <BubbleList :items="items" :roles="roles" :auto-scroll="true" :on-scroll="handleScroll">
        <!-- header: 思考过程在头部 -->
        <template #header="{ item }">
          <ThinkingProcess
            v-if="
              item.role === 'assistant' &&
              ((item.thinking_process?.length ?? 0) > 0 ||
                (!item.loading && (item.tool_calls?.length ?? 0) > 0))
            "
            :steps="item.thinking_process ?? []"
            :tool-calls="item.tool_calls ?? null"
            :show-tool-calls="!item.loading && (item.tool_calls?.length ?? 0) > 0"
          />
        </template>
        <!-- footer: 复制按钮在底部，hover 展示 -->
        <template #footer="{ item }">
          <div v-if="item.role === 'assistant' && item.content" class="bubble-footer-actions">
            <a-tooltip :title="t('common.copy')">
              <a-button
                type="text"
                size="small"
                :icon="h(CopyOutlined)"
                @click="copyMessageContent(item.content)"
              />
            </a-tooltip>
          </div>
        </template>
        <!-- message: 内容区（附件在上、文字在下，各自独立盒子） -->
        <template #message="{ item }">
          <div
            class="flex flex-col gap-3"
            :class="{
              'message-with-attachments': item.fileParts?.length,
              'user-message-attachments': item.role === 'user',
            }"
          >
            <!-- 附件盒子：无背景无边框，控制展示尺寸 用户角色右对齐使用类控制-->
            <div
              v-if="item.fileParts && item.fileParts.length"
              class="message-attachments flex flex-wrap gap-2"
            >
              <template
                v-for="(fp, idx) in item.fileParts"
                :key="fp.url || fp.file_name || fp.name || idx"
              >
                <a-image
                  v-if="isImagePart(fp)"
                  :src="fp.url"
                  :alt="fp.file_name ?? fp.name"
                  class="chat-attachment-image"
                  :preview="true"
                />
                <!-- PDF 附件：参考图 2 卡片样式 -->
                <component
                  :is="fp.url ? 'a' : 'span'"
                  v-else
                  :href="fp.url || undefined"
                  :target="fp.url ? '_blank' : undefined"
                  :rel="fp.url ? 'noopener noreferrer' : undefined"
                  :title="fp.file_name ?? fp.name"
                  class="inline-flex items-center gap-2 text-sm"
                  :class="[
                    isPdfPart(fp) ? 'message-pdf-attachment' : 'message-file-attachment',
                    { 'cursor-pointer': !!fp.url },
                  ]"
                >
                  <FilePdfOutlined
                    v-if="isPdfPart(fp)"
                    class="message-pdf-attachment__icon shrink-0"
                  />
                  <FileOutlined v-else class="shrink-0 text-gray-500" />
                  <span
                    :class="
                      isPdfPart(fp) ? 'message-pdf-attachment__name' : 'truncate max-w-[200px]'
                    "
                    :title="fp.file_name ?? fp.name"
                  >
                    {{
                      isPdfPart(fp)
                        ? truncateFilename(fp.file_name ?? fp.name ?? '')
                        : (fp.file_name ?? fp.name)
                    }}
                  </span>
                </component>
              </template>
            </div>
            <!-- 文字盒子：独立气泡样式 -->
            <div v-if="item.content" class="message-text-bubble w-fit">
              <BubbleRenderer :content="item.content" :show-copy-button="false" />
            </div>
            <SourceCitation
              v-if="item.citations && item.citations.length > 0 && !item.loading"
              :citations="item.citations"
            />
          </div>
        </template>
        <!-- loading 仅显示 spin，思考过程已在 header 展示，避免重复 -->
        <template #loading>
          <div class="flex flex-col gap-2">
            <a-spin size="small" />
          </div>
        </template>
      </BubbleList>
      <div ref="bottomAnchorRef" class="h-px shrink-0" aria-hidden="true" />
    </div>

    <!-- 回到底部：毛玻璃胶囊 + 淡入淡出/上滑（参考 ChatGPT 类产品的悬浮条） -->
    <Transition name="scroll-to-bottom">
      <div v-if="showScrollToBottom" class="scroll-to-bottom-wrap">
        <a-button
          type="default"
          size="small"
          class="scroll-to-bottom-btn"
          :icon="h(VerticalAlignBottomOutlined)"
          @click="goToBottom"
        >
          {{ t('chat.scrollToBottom') }}
        </a-button>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
/* 用户角色右对齐时，附件盒子右对齐 */
.ant-bubble.ant-bubble-end[role='user'] .message-with-attachments {
  align-items: flex-end;
}

/* 附件盒子：无背景、无边框，不撑大文字气泡 */
.message-attachments {
  background: transparent;
  border: none;
  padding: 0;

  /* 附件图片：控制展示尺寸，参考图 2 避免撑大布局 */
  :deep(.chat-attachment-image) {
    max-width: 120px;
    max-height: 120px;
    min-height: 90px;
    width: auto;
    height: auto;
    object-fit: cover;
    border-radius: var(--radius-base);
  }

  /* PDF 附件：参考 ant-attachment-list-card - 浅灰背景、红图标、最小宽高与图片卡片统一 */
  .message-pdf-attachment {
    max-width: 180px;
    max-height: 180px;
    min-height: 90px;
    min-width: 210px;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-base);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    box-shadow: var(--shadow-sm);
    color: var(--color-text-base);
    text-decoration: none;
    transition: background var(--transition-fast);

    &:hover {
      background: var(--color-border-secondary);
    }

    &__icon {
      color: rgb(255, 77, 79);
      font-size: 24px;
    }

    &__name {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  /* 普通文件附件 */
  .message-file-attachment {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-base);
    background: var(--color-bg-layout);
    color: var(--color-text-base);
    text-decoration: none;

    &:hover {
      background: var(--color-border-secondary);
    }
  }
}

/* 文字盒子：独立气泡样式（有附件时生效） */
.message-with-attachments .message-text-bubble {
  background: var(--color-bg-container);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-sm) var(--spacing-md);
}

.scroll-to-bottom-wrap {
  position: absolute;
  bottom: var(--spacing-md);
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.scroll-to-bottom-btn {
  pointer-events: auto;
  display: inline-flex !important;
  align-items: center;
  gap: var(--spacing-xs);
  height: auto !important;
  padding: var(--spacing-sm) var(--spacing-md) !important;
  line-height: 1.25 !important;
  border-radius: var(--radius-full) !important;
  font-weight: 500;
  border: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent) !important;
  background: color-mix(in srgb, var(--color-bg-elevated) 68%, transparent) !important;
  -webkit-backdrop-filter: blur(14px) saturate(165%);
  backdrop-filter: blur(14px) saturate(165%);
  color: var(--color-text-base) !important;
  box-shadow:
    var(--shadow-md),
    0 0 0 1px color-mix(in srgb, var(--color-primary) 12%, transparent);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    color var(--transition-fast);

  &:hover {
    background: color-mix(in srgb, var(--color-bg-elevated) 86%, transparent) !important;
    border-color: color-mix(in srgb, var(--color-primary) 28%, transparent) !important;
    color: var(--color-text-base) !important;
    box-shadow:
      var(--shadow-lg),
      0 0 0 1px color-mix(in srgb, var(--color-primary) 18%, transparent);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

.scroll-to-bottom-enter-active,
.scroll-to-bottom-leave-active {
  transition:
    opacity 0.32s cubic-bezier(0.33, 1, 0.68, 1),
    transform 0.32s cubic-bezier(0.33, 1, 0.68, 1);
}

.scroll-to-bottom-enter-from,
.scroll-to-bottom-leave-to {
  opacity: 0;
  transform: translateY(14px);
}

@media (prefers-reduced-motion: reduce) {
  .scroll-to-bottom-enter-active,
  .scroll-to-bottom-leave-active {
    transition-duration: 0.12s;
    transition-property: opacity;
  }

  .scroll-to-bottom-enter-from,
  .scroll-to-bottom-leave-to {
    transform: none;
  }
}

.bubble-footer-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

/* message-list-wrapper 下的深度选择器 */
.message-list-wrapper {
  /* 仅带附件时去除外层气泡阴影（文字有独立气泡）；单文本保留默认气泡 */
  :deep(
    .ant-bubble.ant-bubble-end[role='user'] .ant-bubble-content:has(.message-with-attachments)
  ) {
    box-shadow: none !important;
  }

  /* 有附件时：Bubble 内容区透明，附件无背景，仅文字有独立气泡 */
  :deep([class*='bubble-content']:has(.message-with-attachments)) {
    background: transparent;
    border: none;
    padding: 0;
  }

  /* 气泡 hover 时展示底部复制按钮 */
  :deep([class*='bubble']:not([class*='list']):hover .bubble-footer-actions) {
    opacity: 1;
  }
}
</style>
