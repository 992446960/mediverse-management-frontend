import axios from 'axios'
import type { Session, Message } from '@/types/chat'

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add interceptor for Authorization if needed (assuming handled globally or here)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface GetSessionsParams {
  page?: number
  page_size?: number
}

export interface GetSessionsResponse {
  total: number
  page: number
  page_size: number
  items: Session[]
}

export async function getChatSessions(
  params: GetSessionsParams = {}
): Promise<GetSessionsResponse> {
  const { data } = await api.get('/sessions', { params })
  return data.data
}

export async function createChatSession(payload: {
  title?: string
  avatar_id?: string
}): Promise<Session> {
  const { data } = await api.post('/sessions', payload)
  return data.data
}

export async function deleteChatSession(id: string): Promise<void> {
  await api.delete(`/sessions/${id}`)
}

export async function renameSession(id: string, payload: { title: string }): Promise<void> {
  await api.patch(`/sessions/${id}`, payload)
}

export async function getMessages(sessionId: string): Promise<Message[]> {
  const { data } = await api.get(`/sessions/${sessionId}/messages`)
  return data.data
}

export async function rateMessage(messageId: string, rating: 'like' | 'dislike'): Promise<void> {
  await api.post(`/messages/${messageId}/rate`, { rating })
}
