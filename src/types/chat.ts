export interface Session {
  id: string
  title: string | null
  avatar_id: string
  avatar_name?: string
  avatar_url?: string
  user_id?: string
  status?: 'active' | 'closed'
  created_at: string
  updated_at?: string
  last_message_at?: string
}

export interface MessagePart {
  type: 'text' | 'image' | 'file'
  text?: string
  url?: string
  file_name?: string
  mime_type?: string
  /** @deprecated use text or url instead */
  content?: string
  metadata?: Record<string, any>
}

export interface ThinkingStep {
  title: string
  /** step description, may be incrementally updated */
  description?: string
  /** @deprecated use description instead */
  content?: string
  status: 'processing' | 'done'
  duration_ms?: number
}

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
  /** Flat text content, used for local streaming state */
  content: string
  parts?: MessagePart[]
  thinking_steps?: ThinkingStep[]
  tool_calls?: ToolCall[] | null
  citations?: SourceCitation[]
  tokens_used?: number | null
  created_at: string
  status?: 'sending' | 'sent' | 'error' | 'streaming'
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

// SSE Event Types
export type SSEEventType = 'thinking_step' | 'delta' | 'done' | 'error'

export interface SSEEventThinkingStep {
  type: 'thinking_step'
  index: number
  title: string
  /** incremental description for this step */
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
