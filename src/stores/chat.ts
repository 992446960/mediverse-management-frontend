import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { message as antMessage } from 'ant-design-vue'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
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
import type { Session, Message, SessionRating, ThinkingProcessStep } from '@/types/chat'

/** 过滤稀疏数组空位，useSSEChat 按 index 写入可能导致 [empty, empty, step] */
function filterThinkingSteps(steps: ThinkingProcessStep[]): ThinkingProcessStep[] {
  return steps.filter((s): s is ThinkingProcessStep => Boolean(s))
}

export const useChatStore = defineStore('chat', () => {
  const { t } = useI18n()

  const sessions = ref<Session[]>([])
  const currentSessionId = ref<string | null>(null)
  const messages = ref<Record<string, Message[]>>({})
  const loadingSessions = ref(false)
  const loadingMessages = ref(false)
  const ratedSessionIds = ref<Set<string>>(new Set())

  const isValidSessionId = (id?: string | null): id is string => Boolean(id && id !== 'undefined')

  const {
    consumeSSE,
    stopGeneration: stopSSEGeneration,
    thinkingProcess: sseThinkingProcess,
    streaming,
  } = useSSEChat()

  const currentSession = computed(
    () => sessions.value.find((s) => s.id === currentSessionId.value) || null
  )

  const groupedSessions = computed(() => {
    const now = dayjs()
    const groups: Record<string, Session[]> = {}

    const sorted = [...sessions.value].sort(
      (a, b) =>
        dayjs(b.last_message_at || b.created_at).valueOf() -
        dayjs(a.last_message_at || a.created_at).valueOf()
    )

    sorted.forEach((session) => {
      const date = dayjs(session.last_message_at || session.created_at)
      let groupKey: string

      if (date.isSame(now, 'day')) {
        groupKey = 'today'
      } else if (date.isSame(now.subtract(1, 'day'), 'day')) {
        groupKey = 'yesterday'
      } else if (date.isAfter(now.subtract(7, 'day'))) {
        groupKey = 'week'
      } else {
        groupKey = date.format('YYYY-MM-DD')
      }

      let bucket = groups[groupKey]
      if (!bucket) {
        bucket = []
        groups[groupKey] = bucket
      }
      bucket.push(session)
    })

    return groups
  })

  async function loadSessions() {
    loadingSessions.value = true
    try {
      const res = await getChatSessions({ page: 1, page_size: 100 })
      sessions.value = res.items.filter((session) => isValidSessionId(session.id))
    } finally {
      loadingSessions.value = false
    }
  }

  async function selectSession(id: string) {
    if (!isValidSessionId(id)) return
    currentSessionId.value = id
    if (!messages.value[id]) {
      loadingMessages.value = true
      try {
        const res = await getMessages(id, { limit: 50 })
        messages.value[id] = res.items
      } finally {
        loadingMessages.value = false
      }
    }
  }

  async function createNewSession(avatarId: string, title?: string): Promise<Session | null> {
    try {
      const { session, greeting, quota } = await createChatSession({
        avatar_id: avatarId,
        idempotency_key: crypto.randomUUID(),
      })

      if (!isValidSessionId(session.id)) {
        throw new Error('创建会话失败：前端未拿到有效的 session.id')
      }

      if (quota?.is_exhausted) {
        antMessage.warning(t('chat.quotaExhausted'))
        return null
      }

      if (title && !session.title) {
        session.title = title
      }
      sessions.value.unshift(session)
      await selectSession(session.id)

      if (greeting) {
        messages.value[session.id] = [
          {
            id: `greeting_${session.id}`,
            session_id: session.id,
            role: 'assistant',
            parts: [{ type: 'text', text: greeting }],
            created_at: session.created_at,
            status: 'sent',
          },
        ]
      }

      return session
    } catch (err: any) {
      if (err?.response?.data?.code === 42901) {
        antMessage.warning(t('chat.quotaExhausted'))
        return null
      }
      throw err
    }
  }

  async function removeSession(id: string) {
    if (!isValidSessionId(id)) return
    await deleteChatSession(id)
    sessions.value = sessions.value.filter((s) => s.id !== id)
    if (currentSessionId.value === id) {
      currentSessionId.value = null
    }
    delete messages.value[id]
  }

  async function updateSessionTitle(id: string, title: string) {
    if (!isValidSessionId(id)) return
    await renameSession(id, { title })
    const session = sessions.value.find((s) => s.id === id)
    if (session) {
      session.title = title
    }
  }

  async function sendMessage(content: string, attachments?: File[]) {
    if (!currentSessionId.value) return

    const sessionId = currentSessionId.value

    const userParts: Message['parts'] = [{ type: 'text', text: content || '' }]
    if (attachments?.length) {
      for (const file of attachments) {
        userParts.push({
          type: file.type.startsWith('image/') ? 'image' : 'file',
          file_name: file.name,
          url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
          mime_type: file.type,
        })
      }
    }

    const userMsgId = `msg_${Date.now()}_u`
    const userMessage: Message = {
      id: userMsgId,
      session_id: sessionId,
      role: 'user',
      parts: userParts,
      created_at: new Date().toISOString(),
      status: 'sent',
    }

    if (!messages.value[sessionId]) messages.value[sessionId] = []
    messages.value[sessionId].push(userMessage)

    const assistantMsgId = `msg_${Date.now()}_a`
    const assistantMessage: Message = {
      id: assistantMsgId,
      session_id: sessionId,
      role: 'assistant',
      parts: [{ type: 'text', text: '' }],
      thinking_process: [],
      created_at: new Date().toISOString(),
      status: 'streaming',
    }
    messages.value[sessionId].push(assistantMessage)

    try {
      const response = await sendMessageRaw(sessionId, {
        text: content,
        attachments,
      })

      const contentType = response.headers.get('content-type') ?? ''
      const isSSE = contentType.includes('text/event-stream')
      if (!isSSE) {
        const text = await response.text()
        try {
          const data = text ? JSON.parse(text) : null
          const wrap = data?.data ?? data
          const contentStr =
            typeof wrap?.content === 'string'
              ? wrap.content
              : typeof wrap?.text === 'string'
                ? wrap.text
                : Array.isArray(wrap?.parts)
                  ? (wrap.parts.find((p: { type?: string; text?: string }) => p.type === 'text')
                      ?.text ?? '')
                  : ''
          const textPart = assistantMessage.parts[0]
          if (textPart) textPart.text = contentStr || ''
        } catch {
          const textPart = assistantMessage.parts[0]
          if (textPart) textPart.text = text || '[非 SSE 响应]'
        }
        assistantMessage.status = 'sent'
        messages.value[sessionId] = [...messages.value[sessionId]!]
        const session = sessions.value.find((s) => s.id === sessionId)
        if (session) session.last_message_at = new Date().toISOString()
        return
      }

      await consumeSSE(response, {
        onDelta: (delta) => {
          const textPart = assistantMessage.parts[0]
          if (textPart) {
            textPart.text = (textPart.text || '') + delta
          }
          assistantMessage.thinking_process = filterThinkingSteps(sseThinkingProcess.value)
          messages.value[sessionId] = [...messages.value[sessionId]!]
        },
        onThinkingStep: () => {
          assistantMessage.thinking_process = filterThinkingSteps(sseThinkingProcess.value)
          messages.value[sessionId] = [...messages.value[sessionId]!]
        },
        onDone: (finalId, tokensUsed) => {
          assistantMessage.id = finalId ?? assistantMessage.id
          assistantMessage.status = 'sent'
          assistantMessage.tokens_used = tokensUsed ?? undefined
          assistantMessage.thinking_process = filterThinkingSteps(sseThinkingProcess.value)
          messages.value[sessionId] = [...messages.value[sessionId]!]
          const session = sessions.value.find((s) => s.id === sessionId)
          if (session) {
            session.last_message_at = new Date().toISOString()
          }
        },
        onStreamEnd: () => {
          if (assistantMessage.status === 'streaming') {
            assistantMessage.status = 'sent'
            assistantMessage.thinking_process = filterThinkingSteps(sseThinkingProcess.value)
            messages.value[sessionId] = [...messages.value[sessionId]!]
            const session = sessions.value.find((s) => s.id === sessionId)
            if (session) {
              session.last_message_at = new Date().toISOString()
            }
          }
        },
        onError: (err) => {
          assistantMessage.status = 'error'
          const textPart = assistantMessage.parts[0]
          if (textPart) {
            textPart.text = (textPart.text || '') + `\n[Error: ${err}]`
          }
          messages.value[sessionId] = [...messages.value[sessionId]!]
        },
      })
    } catch {
      assistantMessage.status = 'error'
      messages.value[sessionId] = [...messages.value[sessionId]!]
    }
  }

  async function submitRating(sessionId: string, rating: SessionRating) {
    await rateSession(sessionId, rating)
    ratedSessionIds.value = new Set([...ratedSessionIds.value, sessionId])
  }

  return {
    sessions,
    currentSessionId,
    currentSession,
    messages,
    groupedSessions,
    loadingSessions,
    loadingMessages,
    ratedSessionIds,
    streaming,
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
