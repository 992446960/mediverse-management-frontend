import type { SourceCitation } from './chat'

export interface SearchResult {
  total: number
  items: SearchCitation[]
  processing_time_ms: number
}

export interface SearchCitation extends SourceCitation {
  file_id?: string
  card_id?: string
  owner_type?: string
  highlight?: string
}
