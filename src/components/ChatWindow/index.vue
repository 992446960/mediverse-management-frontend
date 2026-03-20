<script setup lang="ts">
import { h, computed, onMounted, watch, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { Prompts } from 'ant-design-x-vue'
import {
  BulbOutlined,
  RocketOutlined,
  SmileOutlined,
  StarOutlined,
  StarFilled,
} from '@ant-design/icons-vue'
import MessageList from './MessageList.vue'
import MessageInput from './MessageInput.vue'
import RatingDialog from '@/components/RatingDialog/index.vue'
import { useChatStore } from '@/stores/chat'
import type { Ref } from 'vue'
import { inject } from 'vue'

const { t } = useI18n()
const props = defineProps<{
  sessionId?: string
  isTestMode?: boolean
  avatarId?: string
}>()

const messageInputRef = ref<InstanceType<typeof MessageInput> | null>(null)

/** 与 SkillPanel 同步输入态；分身测试等场景无 provide 时使用本地 ref，避免 undefined 崩溃 */
const skillInputContext = inject<Ref<{ inputText: string; fileList: any[] }>>(
  'skillInputContext',
  ref({ inputText: '', fileList: [] })
)

watch(
  () => ({
    inputText: messageInputRef.value?.inputValue || '',
    fileList: messageInputRef.value?.fileList || [],
  }),
  (v) => {
    skillInputContext.value = v
  },
  { immediate: true, deep: true }
)

const chatStore = useChatStore()
const { messages, currentSessionId, currentSession, loadingMessages, ratedSessionIds } =
  storeToRefs(chatStore)
const { sendMessage, stopGeneration, selectSession, createNewSession } = chatStore

/** 分身测试：进入页面时预创建会话，与首条消息路径一致，以便展示接口返回的开场白 */
const testSessionBootstrap = ref<Promise<void> | null>(null)

function startTestSessionBootstrap() {
  if (!props.isTestMode || !props.avatarId || props.sessionId) return
  if (testSessionBootstrap.value) return
  const p = createNewSession(props.avatarId, t('chat.testSessionTitle'))
    .then(() => undefined)
    .finally(() => {
      testSessionBootstrap.value = null
    })
  testSessionBootstrap.value = p
}

const ratingOpen = ref(false)
const hasRated = computed(
  () => currentSession.value?.id && ratedSessionIds.value.has(currentSession.value.id)
)

const currentMessages = computed(() => {
  const id = props.sessionId || currentSessionId.value
  return id ? messages.value[id] || [] : []
})

const isStreaming = computed(() => {
  const lastMsg = currentMessages.value[currentMessages.value.length - 1]
  return lastMsg?.status === 'streaming'
})

const initialPrompts = [
  { key: '1', label: t('chat.prompt1'), icon: h(BulbOutlined) },
  { key: '2', label: t('chat.prompt2'), icon: h(RocketOutlined) },
  { key: '3', label: t('chat.prompt3'), icon: h(SmileOutlined) },
]

const handleSend = async (
  content: string,
  options?: { thinkingMode?: string; webSearch?: boolean; files?: File[] }
) => {
  if (testSessionBootstrap.value) {
    await testSessionBootstrap.value
  }
  if (!props.sessionId && !currentSessionId.value && props.avatarId) {
    const session = await createNewSession(props.avatarId, content.slice(0, 20))
    if (!session) return
  }

  await sendMessage(content, options?.files)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handlePromptClick = (info: any) => {
  const label = typeof info?.data?.label === 'string' ? info.data.label : ''
  handleSend(label)
}

onMounted(async () => {
  if (props.sessionId) {
    await selectSession(props.sessionId)
    return
  }
  if (props.isTestMode && props.avatarId) {
    startTestSessionBootstrap()
    try {
      await testSessionBootstrap.value
    } catch {
      /* 创建失败时保留空状态，用户可重试发消息再次 create */
    }
  }
})

watch(
  () => props.sessionId,
  async (newId) => {
    if (newId) {
      await selectSession(newId)
    }
  }
)
</script>

<template>
  <div class="chat-window flex flex-col h-full bg-white dark:bg-gray-900">
    <!-- Header（数字医生体验页展示；分身测试页已有页标题，不重复展示） -->
    <div
      v-if="currentSession && !isTestMode"
      class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0"
    >
      <div class="flex items-center gap-3">
        <a-avatar :src="currentSession.avatar_url" :size="36">
          {{ currentSession.avatar_name?.charAt(0) }}
        </a-avatar>
        <div>
          <div class="font-medium text-gray-800 dark:text-gray-100 leading-tight">
            {{ currentSession.avatar_name }}
          </div>
          <div class="text-xs text-gray-400 leading-tight">
            {{ currentSession.title || t('chat.untitledSession') }}
          </div>
        </div>
      </div>
      <a-button
        type="text"
        :class="{ 'rated-star': hasRated }"
        :icon="h(hasRated ? StarFilled : StarOutlined)"
        @click="ratingOpen = true"
      >
        {{ hasRated ? t('chat.rated') : t('chat.rateConversation') }}
      </a-button>
    </div>

    <!-- Messages Area -->
    <div class="flex-1 overflow-hidden relative">
      <MessageList
        v-if="currentMessages.length > 0"
        :key="props.sessionId ?? currentSessionId ?? 'default'"
        :messages="currentMessages"
        :loading="loadingMessages"
        :streaming="isStreaming"
        :session-id="props.sessionId ?? currentSessionId"
      />

      <!-- Empty State / Prompts -->
      <div v-else class="h-full flex flex-col items-center justify-center p-8 text-center">
        <div class="mb-8 flex flex-col items-center">
          <div class="mb-6 p-4 h-full rounded-2xl bg-sky-50 dark:bg-sky-900/20 text-primary">
            <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="currentColor" fill-opacity="0.12" />
              <path
                d="M20 8v24M8 20h24"
                stroke="currentColor"
                stroke-width="3.5"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {{ t('chat.emptyMessages') }}
          </h2>
          <p class="text-gray-500 dark:text-gray-400">{{ t('chat.emptyMessagesHint') }}</p>
        </div>

        <Prompts
          :items="initialPrompts"
          :title="t('chat.tryAsking')"
          class="max-w-md w-full"
          @item-click="handlePromptClick"
        />
      </div>
    </div>

    <!-- Input Area -->
    <MessageInput
      ref="messageInputRef"
      :loading="isStreaming"
      @send="handleSend"
      @stop="stopGeneration"
    />

    <!-- Rating Dialog -->
    <RatingDialog
      v-if="currentSession && !isTestMode"
      v-model:open="ratingOpen"
      :session-id="currentSession.id"
      :has-rated="!!hasRated"
    />
  </div>
</template>

<style scoped>
.chat-window {
  height: 100%;
}

/* 已评价星星与 Rate 组件同色（antdv Rate 使用 yellow-6） */
.rated-star :deep(.anticon) {
  color: var(--ant-yellow-6, #fadb14);
}
</style>
