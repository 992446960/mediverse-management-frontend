import { request } from '@/api/index'
import type { AvatarStatsData } from '@/types/avatarConfig'
import type { OwnerType } from '@/constants/avatar'

/** 后端可能返回 snake_case，统一转换为前端 camelCase */
interface AvatarStatsRaw {
  total_sessions?: number
  today_sessions?: number
  today_tokens_used?: number
  total_tokens_used?: number
  total_references?: number
  knowledge_progress?: number | string
}

function normalizeStats(raw: AvatarStatsRaw | AvatarStatsData): AvatarStatsData {
  if ('totalSessions' in raw && typeof raw.totalSessions === 'number') {
    return raw as AvatarStatsData
  }
  const r = raw as AvatarStatsRaw
  return {
    totalSessions: r.total_sessions ?? 0,
    todaySessions: r.today_sessions ?? 0,
    todayTokensUsed: r.today_tokens_used ?? 0,
    totalTokensUsed: r.total_tokens_used ?? 0,
    totalReferences: r.total_references ?? 0,
  }
}

/**
 * 获取分身统计数据
 * GET /api/v1/my/avatar/stats/{owner_type}/{owner_id}
 */
export async function getAvatarStats(ownerType: OwnerType, ownerId: string) {
  const res = await request.get<AvatarStatsRaw | AvatarStatsData>(
    `/my/avatar/stats/${ownerType}/${ownerId}`
  )
  return normalizeStats(res)
}
