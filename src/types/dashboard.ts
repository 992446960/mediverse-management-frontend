import type { OwnerType } from '@/constants/avatar'
import type { AvatarStatsData } from '@/types/avatarConfig'

/** 仪表盘上某一路分身统计（个人 / 科室 / 机构） */
export interface DashboardBranchStat {
  ownerType: OwnerType
  ownerId: string
  data: AvatarStatsData
}
