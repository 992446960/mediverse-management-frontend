import type { CardType, OwnerType } from '@/types/knowledge'

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
