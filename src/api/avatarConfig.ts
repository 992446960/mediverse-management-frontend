import { request } from '@/api/index'
import type { AvatarConfig, UpdateAvatarConfigParams } from '@/types/avatarConfig'
import type { OwnerType } from '@/constants/avatar'

/**
 * 获取分身配置
 * 个人：/api/v1/my/avatar
 * 科室/机构：/api/v1/avatars/config/:owner_type/:owner_id
 */
export function getAvatarConfig(ownerType: OwnerType, ownerId?: string) {
  const url = ownerType === 'personal' ? '/my/avatar' : `/avatars/config/${ownerType}/${ownerId}`
  return request.get<AvatarConfig>(url)
}

/**
 * 更新分身配置
 */
export function updateAvatarConfig(
  ownerType: OwnerType,
  ownerId: string | undefined,
  data: UpdateAvatarConfigParams
) {
  const url = ownerType === 'personal' ? '/my/avatar' : `/avatars/config/${ownerType}/${ownerId}`
  return request.put<AvatarConfig>(url, data)
}
