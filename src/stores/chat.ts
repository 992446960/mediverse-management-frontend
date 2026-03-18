import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import {
  getChatSessions,
  createChatSession,
  deleteChatSession,
  renameSession,
  getMessages,
  rateSession,
  sendMessageRaw,
} from '@/api/sessions'
import { useSSEChat } from '@/composables/useSSEChat'
import type { Session, Message, SessionRating } from '@/types/chat'

export const useChatStore = defineStore('chat', () => {
  const sessions = ref<Session[]>([])
  const currentSessionId = ref<string | null>(null)
  const messages = ref<Record<string, Message[]>>({})
  const loadingSessions = ref(false)
  const loadingMessages = ref(false)

  const {
    consumeSSE,
    stopGeneration: stopSSEGeneration,
    thinkingSteps: sseThinkingSteps,
  } = useSSEChat()

  const currentSession = computed(
    () => sessions.value.find((s) => s.id === currentSessionId.value) || null
  )

  const groupedSessions = computed(() => {
    const now = dayjs()
    const groups = {
      today: [] as Session[],
      yesterday: [] as Session[],
      week: [] as Session[],
      earlier: [] as Session[],
    }

    const sorted = [...sessions.value].sort(
      (a, b) =>
        dayjs(b.last_message_at || b.updated_at || b.created_at).valueOf() -
        dayjs(a.last_message_at || a.updated_at || a.created_at).valueOf()
    )

    sorted.forEach((session) => {
      const date = dayjs(session.last_message_at || session.updated_at || session.created_at)
      if (date.isSame(now, 'day')) {
        groups.today.push(session)
      } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
        groups.yesterday.push(session)
      } else if (date.isAfter(now.subtract(7, 'day'))) {
        groups.week.push(session)
      } else {
        groups.earlier.push(session)
      }
    })

    return groups
  })

  async function loadSessions() {
    loadingSessions.value = true
    try {
      const res = await getChatSessions({ page: 1, page_size: 100 })
      sessions.value = res.items
    } finally {
      loadingSessions.value = false
    }
  }

  async function selectSession(id: string) {
    currentSessionId.value = id
    if (!messages.value[id]) {
      loadingMessages.value = true
      try {
        const res = await getMessages(id, { limit: 50 })
        // API 返回 has_more + items；items 按时间升序展示
        messages.value[id] = res.items
      } finally {
        loadingMessages.value = false
      }
    }
  }

  async function createNewSession(avatarId: string, title?: string) {
    const session = await createChatSession({
      avatar_id: avatarId,
      idempotency_key: crypto.randomUUID(),
    })
    // 更新本地 title（API 返回时 title 可能为 null）
    if (title && !session.title) {
      session.title = title
    }
    sessions.value.unshift(session)
    await selectSession(session.id)
    return session
  }

  async function removeSession(id: string) {
    await deleteChatSession(id)
    sessions.value = sessions.value.filter((s) => s.id !== id)
    if (currentSessionId.value === id) {
      currentSessionId.value = null
    }
    delete messages.value[id]
  }

  async function updateSessionTitle(id: string, title: string) {
    await renameSession(id, { title })
    const session = sessions.value.find((s) => s.id === id)
    if (session) {
      session.title = title
    }
  }

  async function sendMessage(content: string, attachments?: File[]) {
    if (!currentSessionId.value) return

    const sessionId = currentSessionId.value

    // 1. Add user message (optimistic)
    const userMsgId = `msg_${Date.now()}_u`
    const userMessage: Message = {
      id: userMsgId,
      session_id: sessionId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
      status: 'sent',
    }

    if (!messages.value[sessionId]) messages.value[sessionId] = []
    messages.value[sessionId].push(userMessage)

    // 2. Add placeholder assistant message
    const assistantMsgId = `msg_${Date.now()}_a`
    const assistantMessage: Message = {
      id: assistantMsgId,
      session_id: sessionId,
      role: 'assistant',
      content: '',
      thinking_steps: [],
      created_at: new Date().toISOString(),
      status: 'streaming',
    }
    messages.value[sessionId].push(assistantMessage)

    // 3. Send via multipart/form-data SSE
    try {
      const response = await sendMessageRaw(sessionId, {
        text: content,
        attachments,
      })

      await consumeSSE(response, {
        onDelta: (delta) => {
          assistantMessage.content += delta
          assistantMessage.thinking_steps = [...sseThinkingSteps.value]
        },
        onDone: (finalId, tokensUsed) => {
          assistantMessage.id = finalId
          assistantMessage.status = 'sent'
          assistantMessage.tokens_used = tokensUsed
          assistantMessage.thinking_steps = [...sseThinkingSteps.value]
          // Update session last_message_at
          const session = sessions.value.find((s) => s.id === sessionId)
          if (session) {
            session.last_message_at = new Date().toISOString()
          }
        },
        onError: (err) => {
          assistantMessage.status = 'error'
          assistantMessage.content += `\n[Error: ${err}]`
        },
      })
    } catch {
      assistantMessage.status = 'error'
    }
  }

  async function submitRating(sessionId: string, rating: SessionRating) {
    await rateSession(sessionId, rating)
  }

  return {
    sessions,
    currentSessionId,
    currentSession,
    messages,
    groupedSessions,
    loadingSessions,
    loadingMessages,
    loadSessions,
    selectSession,
    createNewSession,
    removeSession,
    updateSessionTitle,
    sendMessage,
    stopGeneration: stopSSEGeneration,
    submitRating,
  }
})
