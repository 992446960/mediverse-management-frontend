import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import {
  getChatSessions,
  createChatSession,
  deleteChatSession,
  renameSession,
  getMessages,
  rateMessage,
} from '@/api/sessions'
import { useSSEChat } from '@/composables/useSSEChat'
import type { Session, Message } from '@/types/chat'

export const useChatStore = defineStore('chat', () => {
  const sessions = ref<Session[]>([])
  const currentSessionId = ref<string | null>(null)
  const messages = ref<Record<string, Message[]>>({})
  const loadingSessions = ref(false)
  const loadingMessages = ref(false)

  // Use the SSE composable
  const {
    sendMessage: sseSendMessage,
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

    // Sort sessions by updated_at desc
    const sorted = [...sessions.value].sort(
      (a, b) => dayjs(b.updated_at).valueOf() - dayjs(a.updated_at).valueOf()
    )

    sorted.forEach((session) => {
      const date = dayjs(session.updated_at)
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
      const res = await getChatSessions({ page: 1, page_size: 100 }) // Load all for now
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
        const res = await getMessages(id)
        messages.value[id] = res
      } finally {
        loadingMessages.value = false
      }
    }
  }

  async function createNewSession(title: string = '新会话', avatarId?: string) {
    const session = await createChatSession({ title, avatar_id: avatarId })
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

  async function sendMessage(content: string) {
    if (!currentSessionId.value) return

    const sessionId = currentSessionId.value

    // 1. Add user message
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

    // 3. Start streaming
    try {
      await sseSendMessage(
        `/api/v1/sessions/${sessionId}/messages`,
        { content }, // TODO: Handle files
        {
          onDelta: (delta) => {
            assistantMessage.content += delta
            // Sync thinking steps
            assistantMessage.thinking_steps = [...sseThinkingSteps.value]
          },
          onDone: (finalId) => {
            assistantMessage.id = finalId // Update with real ID from server
            assistantMessage.status = 'sent'
            // Sync final thinking steps
            assistantMessage.thinking_steps = [...sseThinkingSteps.value]
          },
          onError: (err) => {
            assistantMessage.status = 'error'
            assistantMessage.content += `\n[Error: ${err}]`
          },
        }
      )
    } catch {
      assistantMessage.status = 'error'
    }
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
    rateMessage: async (messageId: string, rating: 'like' | 'dislike') => {
      await rateMessage(messageId, rating)
    },
  }
})
