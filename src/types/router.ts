import 'vue-router'

import type { UserRole } from '@/types/auth'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: string
    requiresAuth?: boolean
    roles?: string[] // 允许的角色
    requiredRoles?: UserRole[]
    keepAlive?: boolean
    hidden?: boolean // 在菜单中隐藏
    activeMenu?: string // 隐藏页对应的侧栏菜单 key
    order?: number // 菜单排序
    noCache?: boolean
    affix?: boolean
  }
}
