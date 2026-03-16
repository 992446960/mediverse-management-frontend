import request from '@/utils/request'

export interface SearchSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface SearchMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  citations?: Citation[]
  relatedQuestions?: string[]
  thinkingSteps?: ThinkingStep[]
}

export interface Citation {
  id: string
  title: string
  content: string
  url?: string
}

export interface ThinkingStep {
  title: string
  status: 'pending' | 'success' | 'error'
  content?: string
  duration?: number
}

export const knowledgeSearchApi = {
  // Create a new search session
  createSession: (data: { query: string }) => {
    return request.post<SearchSession>('/knowledge-search/sessions', data)
  },

  // Get list of search sessions
  getSessions: (params?: { page?: number; pageSize?: number }) => {
    return request.get<{ list: SearchSession[]; total: number }>('/knowledge-search/sessions', {
      params,
    })
  },

  // Delete a search session
  deleteSession: (id: string) => {
    return request.delete(`/knowledge-search/sessions/${id}`)
  },

  // Get messages for a session
  getMessages: (sessionId: string) => {
    return request.get<SearchMessage[]>(`/knowledge-search/sessions/${sessionId}/messages`)
  },

  // Send a follow-up message (SSE) - This is handled by useSSEChat, but we might need a helper here for non-streaming or initial setup if needed.
  // Actually, useSSEChat handles the fetch directly.
}
