import { request } from '@/api/index'
import type { AvatarStatsData } from '@/types/avatarConfig'
import type { OwnerType } from '@/constants/avatar'

/**
 * 获取分身统计数据
 * GET /api/v1/my/avatar/stats/{owner_type}/{owner_id}
 */
export function getAvatarStats(ownerType: OwnerType, ownerId: string) {
  return request.get<AvatarStatsData>(`/my/avatar/stats/${ownerType}/${ownerId}`)
}
