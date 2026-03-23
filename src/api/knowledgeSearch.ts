import { request } from '@/api'

/** API 返回的引用项（与 API 设计 4.2.1 一致） */
export interface ApiCitation {
  index: number
  card_id: string
  card_title: string
  card_type: string
  relevance_score?: number
  content_preview: string
}

/** API 返回的匹配文件 */
export interface MatchedFile {
  file_id: string
  file_name: string
  /** 原文件可访问地址；有值时优先走通用 URL 预览 */
  file_url?: string | null
  relevance_score?: number
}

/** 搜索/追问响应 */
export interface SearchResponse {
  qa_session_id: string
  answer: string
  citations?: ApiCitation[]
  matched_files?: MatchedFile[]
}

/** 搜索历史项 */
export interface HistoryItem {
  id: string
  query: string
  created_at: string
}

/** 前端使用的引用（映射自 API） */
export interface Citation {
  id: string
  title: string
  content: string
  url?: string
  /** API card_type，用于展示类型标签 */
  cardType?: string
}

export interface SearchSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface SearchMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  citations?: Citation[]
  /** 检索命中的文件（与 answer / citations 同源返回） */
  matchedFiles?: MatchedFile[]
  relatedQuestions?: string[]
  thinkingSteps?: ThinkingStep[]
}

export interface ThinkingStep {
  title: string
  status: 'pending' | 'success' | 'error'
  content?: string
  duration?: number
}

/** 将 API 引用转为前端 Citation */
function mapCitation(api: ApiCitation): Citation {
  return {
    id: api.card_id,
    title: api.card_title,
    content: api.content_preview,
    cardType: api.card_type,
  }
}

/** 知识库搜索 API（对接 /api/v1/knowledge-qa） */
export const knowledgeSearchApi = {
  /**
   * 搜索
   * POST /knowledge-qa/search
   */
  search: (data: { query: string; top_k?: number }) => {
    return request.post<SearchResponse>('/knowledge-qa/search', data)
  },

  /**
   * 追问
   * POST /knowledge-qa/follow-up
   */
  followUp: (data: { qa_session_id: string; query: string }) => {
    return request.post<SearchResponse>('/knowledge-qa/follow-up', data)
  },

  /**
   * 查询搜索历史
   * GET /knowledge-qa/history
   */
  getHistory: (params?: { limit?: number }) => {
    return request.get<HistoryItem[]>('/knowledge-qa/history', { params })
  },

  /** 将 API 响应转为前端 assistant 消息格式 */
  mapResponseToMessage: (response: SearchResponse, id?: string): SearchMessage => ({
    id: id ?? `msg-${Date.now()}`,
    role: 'assistant',
    content: response.answer,
    createdAt: new Date().toISOString(),
    citations: response.citations?.map(mapCitation) ?? [],
    matchedFiles: response.matched_files?.length ? [...response.matched_files] : undefined,
  }),
}
