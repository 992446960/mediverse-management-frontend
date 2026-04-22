import type { OwnerType } from '@/constants/avatar'
import type { AvatarStyle } from './avatar'

export interface AvatarConfig {
  id: string
  owner_type: OwnerType
  owner_id: string
  name: string
  avatar_url: string | null
  bio: string | null
  greeting: string | null
  style: AvatarStyle
  style_custom: string | null
  tags: string[]
}

export interface UpdateAvatarConfigParams {
  name?: string
  avatar_url?: string | null
  bio?: string | null
  greeting?: string | null
  style?: AvatarStyle
  style_custom?: string | null
  tags?: string[]
}

/** 知识库索引进度（后端 knowledge_progress） */
export interface AvatarKnowledgeProgress {
  indexedFiles: number
  totalFiles: number
  percentage: number
}

export interface AvatarStatsData {
  totalSessions: number
  todaySessions: number
  /** 今日 Token，后端已格式化的展示文案，如 "282.5k" */
  todayTokenDisplay: string
  /** 累计 Token，后端已格式化的展示文案，如 "18.8million" */
  allTokenDisplay: string
  knowledgeProgress: AvatarKnowledgeProgress
}
