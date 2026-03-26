import { defineStore } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'

export interface TagView {
  fullPath: string
  path: string
  name: string
  title: string
  affix?: boolean
  query?: Record<string, string | (string | null)[]>
  meta?: Record<string, unknown>
}

/** 数字医生相关路由在 TagView 中去重为该 path */
export const CHAT_CANONICAL_TAG_PATH = '/chat'

const CHAT_TAG_TITLE = 'menu.digitalDoctor'

/** 与 leaf 路由名一致，关闭数字医生 Tab 时需从 keep-alive include 中一并移除 */
const CHAT_LEAF_ROUTE_NAMES = ['ChatHome', 'ChatSession'] as const

/** 与 views/chat/layout.vue 中 defineOptions name 一致，供顶层 keep-alive include */
const CHAT_LAYOUT_CACHE_NAME = 'ChatLayout'

/** 当前路由在 Tag 栏对应的去重 path（/chat 与 /chat/session/:id → /chat） */
export function getCanonicalTagPathForRoute(route: RouteLocationNormalized): string {
  const p = route.path
  if (p === CHAT_CANONICAL_TAG_PATH || /^\/chat\/session\/[^/]+$/.test(p)) {
    return CHAT_CANONICAL_TAG_PATH
  }
  return p
}

function getCanonicalPathForTagView(v: TagView): string {
  if (v.path === CHAT_CANONICAL_TAG_PATH) return CHAT_CANONICAL_TAG_PATH
  if (v.path === '/chat' || /^\/chat\/session\//.test(v.path)) return CHAT_CANONICAL_TAG_PATH
  return v.path
}

export const useTagsViewStore = defineStore(
  'tagsView',
  () => {
    const visitedViews = ref<TagView[]>([])
    /** cachedViews 不持久化，刷新后由 restoreCachedViews 从 visitedViews 重建 */
    const cachedViews = ref<string[]>([])

    /** 从 sessionStorage 恢复后合并多条旧版 /chat/session/* 标签 */
    function dedupeChatVisitedViews() {
      const list = visitedViews.value
      const chatIdx: number[] = []
      list.forEach((v, i) => {
        if (getCanonicalPathForTagView(v) === CHAT_CANONICAL_TAG_PATH) chatIdx.push(i)
      })
      if (chatIdx.length === 0) return
      if (chatIdx.length === 1) {
        const i = chatIdx[0]!
        const v = list[i]!
        list[i] = {
          ...v,
          path: CHAT_CANONICAL_TAG_PATH,
          title: CHAT_TAG_TITLE,
        }
        return
      }
      const mergedBase = list[chatIdx[chatIdx.length - 1]!]!
      const merged: TagView = {
        ...mergedBase,
        path: CHAT_CANONICAL_TAG_PATH,
        title: CHAT_TAG_TITLE,
        fullPath: mergedBase.fullPath,
      }
      for (let k = chatIdx.length - 1; k >= 0; k--) {
        list.splice(chatIdx[k]!, 1)
      }
      list.splice(chatIdx[0]!, 0, merged)
    }

    /** 数字医生为嵌套路由：外层 layout 须参与 keep-alive，与 ChatSession 等 leaf 并存 */
    function syncChatLayoutInCache() {
      const hasChat = visitedViews.value.some(
        (v) =>
          v.path === CHAT_CANONICAL_TAG_PATH || v.path === '/chat' || v.path.startsWith('/chat/')
      )
      const idx = cachedViews.value.indexOf(CHAT_LAYOUT_CACHE_NAME)
      if (hasChat) {
        if (idx < 0) cachedViews.value.push(CHAT_LAYOUT_CACHE_NAME)
      } else if (idx >= 0) {
        cachedViews.value.splice(idx, 1)
      }
    }

    /** 刷新页面后根据已持久化的 visitedViews 重建 cachedViews */
    function restoreCachedViews() {
      dedupeChatVisitedViews()
      cachedViews.value = visitedViews.value
        .filter((v) => v.name && !v.meta?.noCache)
        .map((v) => v.name)
      syncChatLayoutInCache()
    }

    function addVisitedView(route: RouteLocationNormalized) {
      if (route.meta.hidden) return
      const tagPath = getCanonicalTagPathForRoute(route)
      const index = visitedViews.value.findIndex((v) => v.path === tagPath)
      if (index >= 0) {
        const prev = visitedViews.value[index]
        if (!prev) return
        const routeName = (route.name as string) || ''
        const isChat = tagPath === CHAT_CANONICAL_TAG_PATH
        visitedViews.value[index] = {
          ...prev,
          path: tagPath,
          fullPath: route.fullPath,
          query: route.query as Record<string, string | (string | null)[]>,
          name: routeName,
          meta: route.meta as Record<string, unknown>,
          title: isChat ? CHAT_TAG_TITLE : (route.meta.title as string) || prev.title,
          affix: route.meta.affix as boolean | undefined,
        }
        return
      }
      const isChat = tagPath === CHAT_CANONICAL_TAG_PATH
      visitedViews.value.push({
        fullPath: route.fullPath,
        path: tagPath,
        name: (route.name as string) || '',
        title: isChat ? CHAT_TAG_TITLE : (route.meta.title as string) || '',
        affix: route.meta.affix as boolean | undefined,
        query: route.query as Record<string, string | (string | null)[]>,
        meta: route.meta as Record<string, unknown>,
      })
    }

    function removeVisitedView(view: TagView) {
      const index = visitedViews.value.findIndex((v) => v.fullPath === view.fullPath)
      if (index >= 0) visitedViews.value.splice(index, 1)
    }

    function addCachedView(route: RouteLocationNormalized) {
      const name = route.name as string
      if (!name || route.meta.noCache || cachedViews.value.includes(name)) return
      cachedViews.value.push(name)
    }

    function removeCachedView(view: TagView) {
      if (view.path === CHAT_CANONICAL_TAG_PATH) {
        const drop = new Set<string>(CHAT_LEAF_ROUTE_NAMES)
        cachedViews.value = cachedViews.value.filter((n) => !drop.has(n))
      } else {
        const index = cachedViews.value.indexOf(view.name)
        if (index >= 0) cachedViews.value.splice(index, 1)
      }
      syncChatLayoutInCache()
    }

    function addView(route: RouteLocationNormalized) {
      addVisitedView(route)
      addCachedView(route)
      syncChatLayoutInCache()
    }

    function removeView(view: TagView): TagView[] {
      removeVisitedView(view)
      removeCachedView(view)
      return [...visitedViews.value]
    }

    function closeOtherViews(view: TagView) {
      visitedViews.value = visitedViews.value.filter((v) => v.affix || v.fullPath === view.fullPath)
      cachedViews.value = cachedViews.value.filter(
        (name) => name === view.name || visitedViews.value.some((v) => v.name === name && v.affix)
      )
      syncChatLayoutInCache()
    }

    function closeLeftViews(view: TagView) {
      const index = visitedViews.value.findIndex((v) => v.fullPath === view.fullPath)
      if (index <= 0) return
      const removed = visitedViews.value.filter((v, i) => i < index && !v.affix)
      removed.forEach((v) => {
        removeVisitedView(v)
        removeCachedView(v)
      })
    }

    function closeRightViews(view: TagView) {
      const index = visitedViews.value.findIndex((v) => v.fullPath === view.fullPath)
      if (index < 0) return
      const removed = visitedViews.value.filter((v, i) => i > index && !v.affix)
      removed.forEach((v) => {
        removeVisitedView(v)
        removeCachedView(v)
      })
    }

    function closeAllViews(): TagView[] {
      visitedViews.value = visitedViews.value.filter((v) => v.affix)
      cachedViews.value = visitedViews.value.map((v) => v.name).filter(Boolean)
      syncChatLayoutInCache()
      return [...visitedViews.value]
    }

    /** setup store 无 Pinia 默认 $reset；登出时清空页签并触发持久化同步 */
    function resetSession() {
      visitedViews.value = []
      cachedViews.value = []
    }

    return {
      visitedViews,
      cachedViews,
      addView,
      removeView,
      closeOtherViews,
      closeLeftViews,
      closeRightViews,
      closeAllViews,
      addVisitedView,
      removeCachedView,
      restoreCachedViews,
      resetSession,
    }
  },
  {
    persist: {
      key: 'mediverse_tags_view',
      storage: sessionStorage,
      pick: ['visitedViews'],
    },
  }
)
