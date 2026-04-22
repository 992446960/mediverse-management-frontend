import { request } from '@/api/index'
import { getToken } from '@/utils/auth'
import type {
  Session,
  SessionQuota,
  GetMessagesResponse,
  SessionRating,
  SessionRatingResponse,
  ChatMessageMode,
} from '@/types/chat'

export interface SendMessageStreamPayload {
  text?: string
  attachments?: File[]
  mode?: ChatMessageMode
  use_web?: boolean
}

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

/** 清空当前用户全部知识库搜索会话 */
export function deleteKbSearchSessionsByUser(): Promise<null> {
  return request.delete<null>('/chat/sessions/kb-search/by-user')
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
 * 3.1.6 发送消息（流式）— 必须使用原生 fetch，返回原始 Response 供 SSE 流式消费
 *
 * 流式仅支持 fetch：
 * - 使用 fetch() 且不调用 response.json()/response.text()，直接交予 consumeSSE 通过
 *   response.body.getReader() 逐块读取，才能实现打字机效果
 * - 禁止用 axios/request 发此接口：axios 会缓冲整个响应体，无法流式读取
 *
 * 请求：POST multipart/form-data（text、mode、use_web、可选 attachments）
 * 响应：Content-Type: text/event-stream 时为 SSE 流；否则按 JSON 处理
 */
export async function sendMessageRaw(
  sessionId: string,
  payload: SendMessageStreamPayload
): Promise<Response> {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  const url = `${baseURL}/chat/sessions/${sessionId}/messages`

  const token = getToken()
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
    'Accept-Encoding': 'identity',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const formData = new FormData()
  if (payload.text !== undefined) {
    formData.append('text', payload.text)
  }
  if (payload.attachments?.length) {
    for (const file of payload.attachments) {
      formData.append('attachments', file)
    }
  }
  if (payload.mode !== undefined) {
    formData.append('mode', payload.mode)
  }
  if (payload.use_web !== undefined) {
    formData.append('use_web', payload.use_web ? 'true' : 'false')
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
