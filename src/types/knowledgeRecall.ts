import type { CardType, FileSource, OwnerType } from '@/types/knowledge'

export interface KnowledgeRecallFormState {
  query: string
  topK: number
  cardTypes: CardType[]
  availableCardTypes?: CardType[]
}

export interface KnowledgeRecallRequest {
  query: string
  top_k: number
  metadata?: {
    card_type?: CardType[]
  }
}

export interface KnowledgeRecallSource {
  id: string
  card_type: CardType
  title: string
  excerpt: string
  relevance_score: number
  recall_score?: number
  json_content?: string
  md_content?: string
  created_at?: string | null
  updated_at?: string | null
  source_files?: FileSource[] | null
  sources?: FileSource[] | null
}

export interface KnowledgeRecallResult {
  query: string
  answer: string
  confidence?: number
  query_time_ms?: number
  count?: number
  sources: KnowledgeRecallSource[]
}

export type KnowledgeRecallOwnerType = Exclude<OwnerType, 'avatar'>

export type KnowledgeRecallStatus = 'success' | 'failed' | 'timeout' | 'error' | string

export interface KnowledgeRecallHistoryParams {
  card_type?: CardType
  recall_status?: KnowledgeRecallStatus
  page?: number
  page_size?: number
}

export interface KnowledgeRecallSessionItem {
  id: string
  owner_type: KnowledgeRecallOwnerType
  owner_id: string
  query: string
  card_type?: CardType | null
  topk?: number | null
  final_answer?: string | null
  card_count: number
  latency?: number | null
  token?: number | null
  error?: string | null
  recall_status: KnowledgeRecallStatus
  created_at: string
  updated_at: string
}

export interface KnowledgeRecallHistoryResponse {
  total: number
  page: number
  page_size: number
  items: KnowledgeRecallSessionItem[]
}

export interface KnowledgeRecallRetrievedSource {
  card_id?: string | null
  recall_score?: number | null
  card_title?: string | null
  card_type?: CardType | null
  card_preview_content?: string | null
  json_content?: string | null
  md_content?: string | null
  source_files?: FileSource[]
  tags?: string[]
  online_status?: string | null
  audit_status?: string | null
  audit_reject_reason?: string | null
  reference_count?: number | null
  created_at?: string | null
  updated_at?: string | null
}

export interface KnowledgeRecallCitation {
  index: number
  card_id?: string | null
  card_title?: string | null
  card_type?: CardType | null
  relevance_score?: number | null
  content_preview?: string | null
  audit_status?: string | null
  audit_reject_reason?: string | null
  online_status?: string | null
  sources?: FileSource[]
  raw?: Record<string, unknown> | null
}

export interface KnowledgeRecallDownstream {
  url?: string | null
  http_status?: number | null
  sync_code?: string | null
  latency_ms?: number | null
  message?: string | null
}

export interface KnowledgeRecallSessionDetail extends KnowledgeRecallSessionItem {
  retrieved_sources?: KnowledgeRecallRetrievedSource[]
  citations?: KnowledgeRecallCitation[]
  downstream?: KnowledgeRecallDownstream | null
  latency_ms?: number | null
}

export interface KnowledgeRecallViewSource {
  id: string
  cardId: string | null
  title: string
  cardType: CardType | ''
  excerpt: string
  score: number | null
  mdContent: string
  jsonContent: string
  sourceFiles: FileSource[]
  tags: string[]
  onlineStatus: string | null
  auditStatus: string | null
  auditRejectReason: string | null
  referenceCount: number | null
  createdAt: string | null
  updatedAt: string | null
}

export interface KnowledgeRecallViewModel {
  sessionId?: string
  query: string
  answer: string
  cardType: CardType | ''
  topK: number | null
  count: number
  status?: KnowledgeRecallStatus
  error?: string | null
  token?: number | null
  queryTimeMs?: number | null
  confidence?: number
  createdAt?: string
  updatedAt?: string
  sources: KnowledgeRecallViewSource[]
  citations: KnowledgeRecallCitation[]
  downstream?: KnowledgeRecallDownstream | null
}
