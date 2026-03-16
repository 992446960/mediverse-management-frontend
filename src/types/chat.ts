export interface Session {
  id: string
  title: string
  avatar_id: string
  user_id: string
  created_at: string
  updated_at: string
  last_message_at?: string
}

export interface MessagePart {
  type: 'text' | 'image' | 'file'
  content: string // text content or url
  metadata?: Record<string, any>
}

export interface ThinkingStep {
  title: string
  content: string
  status: 'thinking' | 'done'
  duration?: number
}

export interface SourceCitation {
  id: string
  title: string
  url?: string
  content_snippet?: string
  score?: number
}

export interface Message {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  parts?: MessagePart[]
  thinking_steps?: ThinkingStep[]
  citations?: SourceCitation[]
  created_at: string
  status?: 'sending' | 'sent' | 'error' | 'streaming'
}

// SSE Event Types
export type SSEEventType = 'thinking_step' | 'delta' | 'done' | 'error'

export interface SSEEventThinkingStep {
  type: 'thinking_step'
  index: number
  title: string
  content: string // incremental content for this step
  status: 'thinking' | 'done'
}

export interface SSEEventDelta {
  type: 'delta'
  content: string
}

export interface SSEEventDone {
  type: 'done'
  message_id: string
}

export interface SSEEventError {
  type: 'error'
  message: string
}

export type SSEEvent = SSEEventThinkingStep | SSEEventDelta | SSEEventDone | SSEEventError
