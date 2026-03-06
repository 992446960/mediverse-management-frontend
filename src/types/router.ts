import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: string
    requiresAuth?: boolean
    roles?: string[] // 允许的角色
    keepAlive?: boolean
    hidden?: boolean // 在菜单中隐藏
    order?: number // 菜单排序
  }
}
