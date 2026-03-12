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

export interface AvatarStatsData {
  totalSessions: number
  todaySessions: number
  todayTokensUsed: number
  totalTokensUsed: number
  totalReferences: number
}
