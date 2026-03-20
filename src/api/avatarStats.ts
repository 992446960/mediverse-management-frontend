import { request } from '@/api/index'
import type { AvatarKnowledgeProgress, AvatarStatsData } from '@/types/avatarConfig'
import type { OwnerType } from '@/constants/avatar'

/** 后端 knowledge_progress */
interface KnowledgeProgressRaw {
  indexed_files?: number
  total_files?: number
  percentage?: number
}

/** 后端 snake_case；兼容旧字段 today_tokens_used / total_tokens_used */
interface AvatarStatsRaw {
  total_sessions?: number
  today_sessions?: number
  today_token?: string
  all_token?: string
  today_tokens_used?: number
  total_tokens_used?: number
  knowledge_progress?: KnowledgeProgressRaw
}

/** 旧版前端 camelCase（Mock 或历史数据） */
interface AvatarStatsLegacyCamel {
  totalSessions?: number
  todaySessions?: number
  todayTokensUsed?: number
  totalTokensUsed?: number
  knowledge_progress?: KnowledgeProgressRaw
}

const EMPTY_PROGRESS: AvatarKnowledgeProgress = {
  indexedFiles: 0,
  totalFiles: 0,
  percentage: 0,
}

function formatTokenCount(n: number): string {
  if (!Number.isFinite(n)) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(Math.round(n))
}

function normalizeKnowledgeProgress(kp: KnowledgeProgressRaw | undefined): AvatarKnowledgeProgress {
  if (!kp || typeof kp !== 'object') return { ...EMPTY_PROGRESS }
  return {
    indexedFiles: kp.indexed_files ?? 0,
    totalFiles: kp.total_files ?? 0,
    percentage: typeof kp.percentage === 'number' ? kp.percentage : 0,
  }
}

function normalizeStats(
  raw: AvatarStatsRaw | AvatarStatsData | AvatarStatsLegacyCamel
): AvatarStatsData {
  if ('todayTokenDisplay' in raw && typeof raw.todayTokenDisplay === 'string') {
    const x = raw as AvatarStatsData
    return {
      totalSessions: x.totalSessions ?? 0,
      todaySessions: x.todaySessions ?? 0,
      todayTokenDisplay: x.todayTokenDisplay || '0',
      allTokenDisplay: x.allTokenDisplay || '0',
      knowledgeProgress: x.knowledgeProgress ?? { ...EMPTY_PROGRESS },
    }
  }

  if ('totalSessions' in raw && typeof raw.totalSessions === 'number') {
    const r = raw as AvatarStatsLegacyCamel
    return {
      totalSessions: r.totalSessions ?? 0,
      todaySessions: r.todaySessions ?? 0,
      todayTokenDisplay: r.todayTokensUsed != null ? formatTokenCount(r.todayTokensUsed) : '0',
      allTokenDisplay: r.totalTokensUsed != null ? formatTokenCount(r.totalTokensUsed) : '0',
      knowledgeProgress: normalizeKnowledgeProgress(r.knowledge_progress),
    }
  }

  const r = raw as AvatarStatsRaw
  const todayStr =
    r.today_token != null && r.today_token !== ''
      ? String(r.today_token)
      : r.today_tokens_used != null
        ? formatTokenCount(r.today_tokens_used)
        : '0'
  const allStr =
    r.all_token != null && r.all_token !== ''
      ? String(r.all_token)
      : r.total_tokens_used != null
        ? formatTokenCount(r.total_tokens_used)
        : '0'

  return {
    totalSessions: r.total_sessions ?? 0,
    todaySessions: r.today_sessions ?? 0,
    todayTokenDisplay: todayStr,
    allTokenDisplay: allStr,
    knowledgeProgress: normalizeKnowledgeProgress(r.knowledge_progress),
  }
}

/**
 * 获取分身统计数据
 * GET /api/v1/my/avatar/stats/{owner_type}/{owner_id}
 */
export async function getAvatarStats(ownerType: OwnerType, ownerId: string) {
  const res = await request.get<AvatarStatsRaw | AvatarStatsData | AvatarStatsLegacyCamel>(
    `/my/avatar/stats/${ownerType}/${ownerId}`
  )
  return normalizeStats(res)
}
