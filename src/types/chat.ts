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

export interface MessagePart {
  type: 'text' | 'image' | 'file'
  text?: string
  url?: string
  file_name?: string
  mime_type?: string
  metadata?: Record<string, any>
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
