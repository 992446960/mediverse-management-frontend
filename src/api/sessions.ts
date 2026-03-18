import type { Session, GetMessagesResponse, SessionRating } from '@/types/chat'

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(
  method: string,
  path: string,
  options: { params?: Record<string, any>; body?: Record<string, any> | FormData } = {}
): Promise<T> {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  let url = `${baseURL}${path}`

  if (options.params) {
    const qs = new URLSearchParams(
      Object.entries(options.params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, String(v)])
    ).toString()
    if (qs) url += `?${qs}`
  }

  const headers: Record<string, string> = { ...getAuthHeaders() }
  let body: BodyInit | undefined

  if (options.body instanceof FormData) {
    body = options.body
    // Let browser set Content-Type with boundary automatically
  } else if (options.body) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  const res = await fetch(url, { method, headers, body })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }
  const json = await res.json()
  return json.data as T
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

export async function getChatSessions(
  params: GetSessionsParams = {}
): Promise<GetSessionsResponse> {
  return request<GetSessionsResponse>('GET', '/chat/sessions', { params })
}

export async function createChatSession(payload: {
  avatar_id: string
  idempotency_key: string
}): Promise<Session> {
  return request<Session>('POST', '/chat/sessions', { body: payload })
}

export async function deleteChatSession(id: string): Promise<void> {
  await request<null>('DELETE', `/chat/sessions/${id}`)
}

export async function renameSession(id: string, payload: { title: string }): Promise<void> {
  await request<null>('PATCH', `/chat/sessions/${id}/title`, { body: payload })
}

export interface GetMessagesParams {
  before_id?: string
  limit?: number
}

export async function getMessages(
  sessionId: string,
  params: GetMessagesParams = {}
): Promise<GetMessagesResponse> {
  return request<GetMessagesResponse>('GET', `/chat/sessions/${sessionId}/messages`, { params })
}

export async function rateSession(sessionId: string, payload: SessionRating): Promise<void> {
  await request<null>('POST', `/chat/sessions/${sessionId}/ratings`, {
    body: payload as Record<string, any>,
  })
}

/**
 * 发送消息（流式）— 返回原始 Response 供 SSE 消费
 * Content-Type: multipart/form-data
 */
export async function sendMessageRaw(
  sessionId: string,
  payload: { text?: string; attachments?: File[] }
): Promise<Response> {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  const url = `${baseURL}/chat/sessions/${sessionId}/messages`
  const headers = getAuthHeaders()

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
