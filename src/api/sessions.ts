import { request } from '@/api/index'
import { getToken } from '@/utils/auth'
import type {
  Session,
  SessionQuota,
  GetMessagesResponse,
  SessionRating,
  SessionRatingResponse,
} from '@/types/chat'

export interface GetSessionsParams {
  avatar_id?: string
  page?: number
  page_size?: number
}

export interface GetSessionsResponse {
  total?: number
  page?: number
  page_size?: number
  items: Session[]
}

export interface CreateChatSessionResponse {
  session: Session
  greeting: string | null
  quota?: SessionQuota
}

/** 3.1.2 查询会话列表 */
export function getChatSessions(params: GetSessionsParams = {}): Promise<GetSessionsResponse> {
  return request.get<GetSessionsResponse>('/chat/sessions', { params })
}

/** 3.1.3 新建会话 */
export async function createChatSession(payload: {
  avatar_id: string
  idempotency_key: string
}): Promise<CreateChatSessionResponse> {
  const res = await request.post<CreateChatSessionResponse>('/chat/sessions', payload)

  if (!res?.session?.id) {
    throw new Error('创建会话失败：后端未返回有效的 session.id')
  }

  return res
}

/** 删除会话 */
export function deleteChatSession(id: string): Promise<null> {
  return request.delete<null>(`/chat/sessions/${id}`)
}

/** 3.1.4 重命名会话 */
export function renameSession(id: string, payload: { title: string }): Promise<null> {
  return request.patch<null>(`/chat/sessions/${id}/title`, payload)
}

export interface GetMessagesParams {
  before_id?: string
  limit?: number
}

/** 3.1.5 获取历史消息 */
export function getMessages(
  sessionId: string,
  params: GetMessagesParams = {}
): Promise<GetMessagesResponse> {
  return request.get<GetMessagesResponse>(`/chat/sessions/${sessionId}/messages`, { params })
}

/** 3.1.7 提交评分 */
export function rateSession(
  sessionId: string,
  payload: SessionRating
): Promise<SessionRatingResponse> {
  return request.post<SessionRatingResponse>(`/chat/sessions/${sessionId}/ratings`, payload)
}

export interface AvatarSkill {
  id: string
  name: string
  description: string
  icon?: string
}

/** 获取分身可用技能列表（mock） */
export function getAvatarSkills(avatarId: string): Promise<AvatarSkill[]> {
  return request.get<AvatarSkill[]>(`/chat/avatars/${avatarId}/skills`)
}

/**
 * 3.1.6 发送消息（流式）— 返回原始 Response 供 SSE 消费
 * 必须使用原生 fetch，axios 适配器会缓冲整个响应体，无法流式读取
 * Content-Type: multipart/form-data
 */
export async function sendMessageRaw(
  sessionId: string,
  payload: { text?: string; attachments?: File[] }
): Promise<Response> {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  const url = `${baseURL}/chat/sessions/${sessionId}/messages`

  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const formData = new FormData()
  if (payload.text) {
    formData.append('text', payload.text)
  }
  if (payload.attachments?.length) {
    for (const file of payload.attachments) {
      formData.append('attachments', file)
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }

  return res
}
