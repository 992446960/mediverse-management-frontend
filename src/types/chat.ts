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
  content: string // 兼容旧结构，主要内容
  parts?: MessagePart[] // 新结构支持多模态
  thinking_steps?: ThinkingStep[]
  citations?: SourceCitation[]
  created_at: string
  status?: 'sending' | 'sent' | 'error' | 'streaming'
}
