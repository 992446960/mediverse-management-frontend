import { request } from '@/api/index'
import type { AvatarConfig } from '@/types/avatarConfig'
import type { OwnerType } from '@/constants/avatar'

/**
 * 获取分身配置（含 id；更新见 `@/api/avatars` 的 updateAvatar）
 *
 * 统一：GET /api/v1/my/avatar/{owner_type}/{owner_id}
 * 个人：`owner_type = personal`，`owner_id = user.id`
 */
export function getAvatarConfig(ownerType: OwnerType, ownerId: string) {
  return request.get<AvatarConfig>(`/my/avatar/${ownerType}/${ownerId}`)
}
