<script setup lang="ts">
import { h, computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { BubbleList, Bubble } from 'ant-design-x-vue'
import BubbleRenderer from './BubbleRenderer.vue'
import ThinkingProcess from './ThinkingProcess.vue'
import SourceCitation from './SourceCitation.vue'
import SkillCallDisplay from './SkillCallDisplay.vue'
import type { Message, MessagePart } from '@/types/chat'
import { getMessageText } from '@/types/chat'
import {
  UserOutlined,
  RobotOutlined,
  FileOutlined,
  VerticalAlignBottomOutlined,
} from '@ant-design/icons-vue'
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

const items = computed(() => {
  return props.messages.map((msg) => ({
    key: msg.id,
    role: msg.role,
    content: getMessageText(msg),
    fileParts: getFileParts(msg),
    thinking_process: msg.thinking_process,
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
    bottomAnchorRef.value?.scrollIntoView({ block: 'end', behavior: 'auto' })
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

const roles = {
  user: {
    placement: 'end',
    variant: 'shadow',
    avatar: { icon: h(UserOutlined), style: { backgroundColor: '#87d068' } },
  },
  assistant: {
    placement: 'start',
    variant: 'outlined',
    avatar: { icon: h(RobotOutlined), style: { backgroundColor: '#1890ff' } },
    // typing 由 items 中按 msg.status 控制，历史记录不显示打字效果
  },
}
</script>

<template>
  <div class="message-list-wrapper relative h-full pb-4">
    <div ref="listContainerRef" class="message-list h-full overflow-y-auto p-4 pb-0">
      <BubbleList :items="items" :roles="roles" :auto-scroll="true" :on-scroll="handleScroll">
        <template #item="{ item }">
          <Bubble
            :content="item.content"
            :loading="item.loading"
            :variant="item.role === 'user' ? 'shadow' : 'outlined'"
            :placement="item.role === 'user' ? 'end' : 'start'"
            :avatar="item.avatar"
          >
            <template #messageRender="{ content }">
              <div class="flex flex-col gap-2">
                <!-- Thinking Process -->
                <ThinkingProcess
                  v-if="item.thinking_process && item.thinking_process.length > 0"
                  :steps="item.thinking_process"
                />

                <!-- Skill Call Display (tool_calls, 仅历史消息) -->
                <SkillCallDisplay
                  v-if="item.tool_calls && item.tool_calls.length > 0 && !item.loading"
                  :tool-calls="item.tool_calls"
                />

                <!-- Content: 文本 -->
                <BubbleRenderer v-if="content" :content="content" />

                <!-- 用户消息附件展示 -->
                <div
                  v-if="item.fileParts && item.fileParts.length"
                  class="flex flex-wrap gap-2 mt-1"
                >
                  <template
                    v-for="(fp, idx) in item.fileParts"
                    :key="fp.url || fp.file_name || idx"
                  >
                    <a-image
                      v-if="fp.url && (fp.type === 'image' || fp.url.startsWith('blob:'))"
                      :src="fp.url"
                      :alt="fp.file_name"
                      class="chat-attachment-image rounded border border-gray-200 dark:border-gray-600"
                      :preview="true"
                    />
                    <span
                      v-else
                      class="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300"
                    >
                      <FileOutlined />
                      {{ fp.file_name }}
                    </span>
                  </template>
                </div>

                <!-- Citations (仅历史消息) -->
                <SourceCitation
                  v-if="item.citations && item.citations.length > 0 && !item.loading"
                  :citations="item.citations"
                />
              </div>
            </template>

            <template v-if="item.role === 'assistant' && !item.loading" #actions>
              <div class="flex gap-2 text-gray-400 text-xs mt-1" />
            </template>
          </Bubble>
        </template>
      </BubbleList>
      <div ref="bottomAnchorRef" class="h-px shrink-0" aria-hidden="true" />
    </div>

    <!-- 回到底部按钮：用户上滑查看历史时显示 -->
    <Transition name="fade">
      <a-button
        v-if="showScrollToBottom"
        type="primary"
        size="small"
        class="scroll-to-bottom-btn absolute bottom-4 left-1/2 -translate-x-1/2 shadow-lg"
        :icon="h(VerticalAlignBottomOutlined)"
        @click="goToBottom"
      >
        {{ t('chat.scrollToBottom') }}
      </a-button>
    </Transition>
  </div>
</template>

<style scoped>
.chat-attachment-image :deep(img) {
  width: 64px;
  height: 64px;
  object-fit: cover;
}

.scroll-to-bottom-btn {
  z-index: 10;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
