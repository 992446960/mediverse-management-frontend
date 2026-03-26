export interface Session {
  id: string
  title: string | null
  avatar_id: string
  avatar_name: string
  avatar_url: string
  status: 'active' | 'closed'
  created_at: string
  last_message_at?: string
}

export interface SessionQuota {
  avatar_scope: string
  max_sessions: number | null
  used_sessions: number
  remaining: number | null
  is_unlimited: boolean
  is_exhausted: boolean
}

/** 发送消息（流式）表单字段 mode */
export type ChatMessageMode = 'balance' | 'fast' | 'deep'

/** 图片扩展名（API 可能返回 type: 'file' 的图片） */
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|svg)(\?|$)/i

/** PDF 扩展名或 mime 类型 */
const PDF_EXT = /\.pdf(\?|$)/i
const PDF_MIME = /^application\/pdf$/i

export interface MessagePart {
  type: 'text' | 'image' | 'file'
  text?: string
  url?: string
  /** 前端/上传使用 */
  file_name?: string
  /** API 历史消息返回 */
  name?: string
  mime_type?: string
  metadata?: Record<string, any>
}

export function isImagePart(p: MessagePart): boolean {
  if (!p.url) return false
  if (p.type === 'image') return true
  if (p.url.startsWith('blob:')) return true
  if (p.type === 'file' && IMAGE_EXT.test(p.url)) return true
  const fn = p.file_name ?? p.name ?? ''
  if (p.type === 'file' && fn && IMAGE_EXT.test(fn)) return true
  return false
}

export function isPdfPart(p: MessagePart): boolean {
  if (p.type === 'file' && p.mime_type && PDF_MIME.test(p.mime_type)) return true
  const fn = p.file_name ?? p.name ?? ''
  if (p.type === 'file' && fn && PDF_EXT.test(fn)) return true
  if (p.url && PDF_EXT.test(p.url)) return true
  return false
}

export interface ThinkingProcessStep {
  title: string
  description?: string
  status: 'processing' | 'done'
  duration_ms?: number
  duration?: string
}

/** Kept for future card detail API usage */
export interface SourceCitation {
  id: string
  title: string
  url?: string
  content_snippet?: string
  score?: number
}

export interface ToolCall {
  skill_name: string
  skill_description?: string
  args?: Record<string, any>
  result?: Record<string, any>
  duration_ms?: number
}

export interface Message {
  id: string
  session_id: string
  avatar_id?: string
  role: 'user' | 'assistant' | 'tool'
  parts: MessagePart[]
  thinking_process?: ThinkingProcessStep[]
  tool_calls?: ToolCall[] | null
  citations?: string[]
  sources?: unknown
  tokens_used?: number | null
  created_at: string
  status?: 'sending' | 'sent' | 'error' | 'streaming'
}

export function getMessageText(msg: Message): string {
  return msg.parts?.find((p) => p.type === 'text')?.text || ''
}

export interface GetMessagesResponse {
  has_more: boolean
  items: Message[]
}

export interface SessionRating {
  scores: {
    accuracy?: number
    completion?: number
    [key: string]: number | undefined
  }
  feedback_text?: string
}

export interface SessionRatingResponse {
  id: string
  session_id: string
  scores: SessionRating['scores']
  feedback_text?: string
  created_at: string
}

// SSE Event Types
export type SSEEventType = 'thinking_step' | 'delta' | 'done' | 'error'

export interface SSEEventThinkingStep {
  type: 'thinking_step'
  index: number
  title: string
  description?: string
  status: 'processing' | 'done'
  duration_ms?: number
}

export interface SSEEventDelta {
  type: 'delta'
  content: string
}

export interface SSEEventDone {
  type: 'done'
  message_id: string
  tokens_used?: number
}

export interface SSEEventError {
  type: 'error'
  code?: number
  message: string
}

export type SSEEvent = SSEEventThinkingStep | SSEEventDelta | SSEEventDone | SSEEventError
