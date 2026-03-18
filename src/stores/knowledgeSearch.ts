import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  knowledgeSearchApi,
  type SearchSession,
  type SearchMessage,
  type HistoryItem,
} from '@/api/knowledgeSearch'

/** 将历史项转为会话格式 */
function historyToSession(item: HistoryItem): SearchSession {
  return {
    id: item.id,
    title: item.query,
    createdAt: item.created_at,
    updatedAt: item.created_at,
  }
}

export const useKnowledgeSearchStore = defineStore('knowledgeSearch', () => {
  const sessions = ref<SearchSession[]>([])
  const currentSessionId = ref<string | null>(null)
  const messages = ref<SearchMessage[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const streaming = ref(false)

  /** 用于历史会话加载时展示首条用户问题（无 API 时） */
  const messagesBySession = ref<Record<string, SearchMessage[]>>({})

  const currentSession = computed(() => sessions.value.find((s) => s.id === currentSessionId.value))

  const groupedSessions = computed(() => {
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
      const list = await knowledgeSearchApi.getHistory({ limit: 50 })
      sessions.value = list.map(historyToSession)
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建搜索会话（调用 search API，同步返回）
   */
  async function createSession(query: string) {
    loading.value = true
    try {
      const res = await knowledgeSearchApi.search({ query })
      const session: SearchSession = {
        id: res.qa_session_id,
        title: query,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      sessions.value.unshift(session)
      currentSessionId.value = res.qa_session_id

      const userMessage: SearchMessage = {
        id: `u-${Date.now()}`,
        role: 'user',
        content: query,
        createdAt: new Date().toISOString(),
      }
      const assistantMessage = knowledgeSearchApi.mapResponseToMessage(res)
      messages.value = [userMessage, assistantMessage]
      messagesBySession.value[res.qa_session_id] = [...messages.value]

      return session
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除会话（仅本地移除，API 无此接口）
   */
  async function deleteSession(id: string) {
    sessions.value = sessions.value.filter((s) => s.id !== id)
    delete messagesBySession.value[id]
    if (currentSessionId.value === id) {
      currentSessionId.value = null
      messages.value = []
    }
  }

  /**
   * 加载会话消息（历史会话无 API 时从本地缓存或仅展示首条问题）
   */
  function loadMessages(sessionId: string) {
    currentSessionId.value = sessionId
    const cached = messagesBySession.value[sessionId]
    if (cached) {
      messages.value = cached
      return
    }
    const session = sessions.value.find((s) => s.id === sessionId)
    if (session) {
      messages.value = [
        {
          id: `u-${sessionId}`,
          role: 'user',
          content: session.title,
          createdAt: session.createdAt,
        },
      ]
    } else {
      messages.value = []
    }
  }

  /**
   * 追问（调用 follow-up API，同步返回）
   */
  async function sendFollowUp(content: string) {
    if (!currentSessionId.value) return

    const userMessage: SearchMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    messages.value.push(userMessage)

    streaming.value = true
    try {
      const res = await knowledgeSearchApi.followUp({
        qa_session_id: currentSessionId.value,
        query: content,
      })
      const assistantMessage = knowledgeSearchApi.mapResponseToMessage(res)
      messages.value.push(assistantMessage)
      messagesBySession.value[currentSessionId.value] = [...messages.value]

      const session = sessions.value.find((s) => s.id === currentSessionId.value)
      if (session) {
        session.updatedAt = new Date().toISOString()
      }
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      streaming.value = false
    }
  }

  function stopGeneration() {
    streaming.value = false
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
    currentText: ref(''),
    thinkingSteps: ref([]),
    fetchSessions,
    createSession,
    deleteSession,
    loadMessages,
    sendFollowUp,
    stopGeneration,
  }
})
