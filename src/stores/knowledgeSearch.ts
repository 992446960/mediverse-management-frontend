import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { knowledgeSearchApi, type SearchSession, type SearchMessage } from '@/api/knowledgeSearch'
import { useSSEChat } from '@/composables/useSSEChat'

export const useKnowledgeSearchStore = defineStore('knowledgeSearch', () => {
  const sessions = ref<SearchSession[]>([])
  const currentSessionId = ref<string | null>(null)
  const messages = ref<SearchMessage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const { streaming, currentText, thinkingSteps, sendMessage, stopGeneration } = useSSEChat()

  const currentSession = computed(() => sessions.value.find((s) => s.id === currentSessionId.value))

  const groupedSessions = computed(() => {
    // Group sessions by date: Today, Yesterday, Last 7 Days, Older
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const yesterday = today - 86400000
    const weekAgo = today - 86400000 * 7

    const groups = {
      today: [] as SearchSession[],
      yesterday: [] as SearchSession[],
      week: [] as SearchSession[],
      earlier: [] as SearchSession[],
    }

    sessions.value.forEach((session) => {
      const sessionDate = new Date(session.updatedAt).getTime()
      if (sessionDate >= today) {
        groups.today.push(session)
      } else if (sessionDate >= yesterday) {
        groups.yesterday.push(session)
      } else if (sessionDate >= weekAgo) {
        groups.week.push(session)
      } else {
        groups.earlier.push(session)
      }
    })

    return groups
  })

  async function fetchSessions() {
    loading.value = true
    try {
      const res = await knowledgeSearchApi.getSessions()
      sessions.value = res.list
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function createSession(query: string) {
    loading.value = true
    try {
      const res = await knowledgeSearchApi.createSession({ query })
      sessions.value.unshift(res)
      currentSessionId.value = res.id
      // Start streaming the first message if needed, or just set the session
      // Usually creating a session might return the first message or trigger a stream
      // For now, let's assume createSession just creates the session context
      return res
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteSession(id: string) {
    try {
      await knowledgeSearchApi.deleteSession(id)
      sessions.value = sessions.value.filter((s) => s.id !== id)
      if (currentSessionId.value === id) {
        currentSessionId.value = null
        messages.value = []
      }
    } catch (err: any) {
      error.value = err.message
    }
  }

  async function loadMessages(sessionId: string) {
    loading.value = true
    currentSessionId.value = sessionId
    try {
      const res = await knowledgeSearchApi.getMessages(sessionId)
      messages.value = res
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function sendFollowUp(content: string) {
    if (!currentSessionId.value) return

    const userMessage: SearchMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    messages.value.push(userMessage)

    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: SearchMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      thinkingSteps: [],
    }
    messages.value.push(assistantMessage)

    await sendMessage(
      `/api/knowledge-search/sessions/${currentSessionId.value}/messages`,
      { content },
      {
        onDelta: (text) => {
          assistantMessage.content += text
        },
        onThinking: (steps) => {
          assistantMessage.thinkingSteps = [...steps]
        },
        onDone: (msgId, event) => {
          assistantMessage.id = msgId
          if (event?.citations) {
            assistantMessage.citations = event.citations
          }
          if (event?.relatedQuestions) {
            assistantMessage.relatedQuestions = event.relatedQuestions
          }
        },
      }
    )
  }

  return {
    sessions,
    currentSessionId,
    currentSession,
    groupedSessions,
    messages,
    loading,
    error,
    streaming,
    currentText,
    thinkingSteps,
    fetchSessions,
    createSession,
    deleteSession,
    loadMessages,
    sendFollowUp,
    stopGeneration,
  }
})
