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

/** 工具调用：流式 done / 历史消息均可能返回（name + title 为主结构） */
export interface ToolCall {
  /** 工具标识，如 file_extract */
  name: string
  /** 展示标题，如「解读上传文件」 */
  title: string
  /** 兼容旧 Mock / 扩展数据 */
  skill_name?: string
  skill_description?: string
  args?: Record<string, unknown>
  result?: Record<string, unknown>
  duration_ms?: number
}

/** SSE type=done 时附带的扩展字段 */
export interface ChatStreamDonePayload {
  tool_calls?: ToolCall[]
  search_references?: unknown[]
  session_id?: string
}

/** 将接口/Mock 中任意 shape 规范为 ToolCall（支持 name+title 与 skill_name+skill_description） */
export function normalizeToolCallsFromApi(raw: unknown): ToolCall[] {
  if (!Array.isArray(raw)) return []
  const out: ToolCall[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const nameFromApi = typeof o.name === 'string' ? o.name.trim() : ''
    const titleFromApi = typeof o.title === 'string' ? o.title.trim() : ''
    const skillName = typeof o.skill_name === 'string' ? o.skill_name.trim() : ''
    const skillDesc = typeof o.skill_description === 'string' ? o.skill_description.trim() : ''
    const name = nameFromApi || skillName
    const title = titleFromApi || skillDesc || name
    if (!name && !title) continue
    const args =
      o.args !== null && typeof o.args === 'object' && !Array.isArray(o.args)
        ? (o.args as Record<string, unknown>)
        : undefined
    const result =
      o.result !== null && typeof o.result === 'object' && !Array.isArray(o.result)
        ? (o.result as Record<string, unknown>)
        : undefined
    const duration_ms = typeof o.duration_ms === 'number' ? o.duration_ms : undefined
    out.push({
      name: name || 'tool',
      title: title || name || 'tool',
      skill_name: skillName || undefined,
      skill_description: skillDesc || undefined,
      args,
      result,
      duration_ms,
    })
  }
  return out
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
