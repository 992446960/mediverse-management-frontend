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

/** 数字医生体验（选分身）页签去重 path */
export const CHAT_HOME_TAG_PATH = '/chat'

/**
 * 分身会话页签去重 path（非真实路由；真实 URL 仍为 /chat/session/:id，存在 fullPath）
 */
export const CHAT_SESSION_TAG_PATH = '/chat/session'

const CHAT_TAG_TITLE_HOME = 'menu.digitalDoctor'
const CHAT_TAG_TITLE_SESSION = 'menu.avatarChat'

/** @deprecated 请使用 CHAT_HOME_TAG_PATH；保留避免外部引用报错 */
export const CHAT_CANONICAL_TAG_PATH = CHAT_HOME_TAG_PATH

/** 与 leaf 路由名一致，关闭任一聊天 Tab 时需从 keep-alive include 中一并移除 */
const CHAT_LEAF_ROUTE_NAMES = ['ChatHome', 'ChatSession'] as const

/** 与 views/chat/layout.vue 中 defineOptions name 一致，供顶层 keep-alive include */
const CHAT_LAYOUT_CACHE_NAME = 'ChatLayout'

/** 当前路由对应的 Tag 去重 path：首页与会话各一条 */
export function getCanonicalTagPathForRoute(route: RouteLocationNormalized): string {
  const p = route.path
  if (p === CHAT_HOME_TAG_PATH) return CHAT_HOME_TAG_PATH
  if (/^\/chat\/session\/[^/]+$/.test(p)) return CHAT_SESSION_TAG_PATH
  return p
}

function isSessionFullPath(fullPath: string): boolean {
  const pathOnly = fullPath.split(/[?#]/)[0] ?? fullPath
  return /^\/chat\/session\/[^/]+/.test(pathOnly)
}

/** 持久化恢复：将标签归为「体验首页」或「分身会话」或 null（非聊天） */
function classifyChatTagForDedupe(v: TagView): 'home' | 'session' | null {
  if (v.path === CHAT_SESSION_TAG_PATH || /^\/chat\/session\//.test(v.path)) return 'session'
  if (isSessionFullPath(v.fullPath) || v.name === 'ChatSession') return 'session'
  const pathOnly = v.fullPath.split(/[?#]/)[0] ?? v.fullPath
  if (pathOnly === '/chat' || v.name === 'ChatHome') return 'home'
  if (v.path === CHAT_HOME_TAG_PATH && !isSessionFullPath(v.fullPath)) return 'home'
  return null
}

export const useTagsViewStore = defineStore(
  'tagsView',
  () => {
    const visitedViews = ref<TagView[]>([])
    /** cachedViews 不持久化，刷新后由 restoreCachedViews 从 visitedViews 重建 */
    const cachedViews = ref<string[]>([])

    /** 从 sessionStorage 恢复：合并重复的首页 / 会话标签，并纠正 path */
    function dedupeChatVisitedViews() {
      const list = visitedViews.value
      const out: TagView[] = []
      let homeGroup: TagView[] = []
      let sessionGroup: TagView[] = []

      const flushHome = () => {
        if (!homeGroup.length) return
        const pure = homeGroup.find((x) => {
          const po = x.fullPath.split(/[?#]/)[0] ?? x.fullPath
          return po === '/chat'
        })
        const base = pure ?? homeGroup[homeGroup.length - 1]!
        out.push({
          ...base,
          path: CHAT_HOME_TAG_PATH,
          title: CHAT_TAG_TITLE_HOME,
          fullPath: pure ? '/chat' : base.fullPath,
        })
        homeGroup = []
      }
      const flushSession = () => {
        if (!sessionGroup.length) return
        const base = sessionGroup[sessionGroup.length - 1]!
        out.push({
          ...base,
          path: CHAT_SESSION_TAG_PATH,
          title: CHAT_TAG_TITLE_SESSION,
          fullPath: base.fullPath,
        })
        sessionGroup = []
      }

      for (const v of list) {
        const k = classifyChatTagForDedupe(v)
        if (k === 'home') {
          flushSession()
          homeGroup.push(v)
        } else if (k === 'session') {
          flushHome()
          sessionGroup.push(v)
        } else {
          flushHome()
          flushSession()
          out.push(v)
        }
      }
      flushHome()
      flushSession()
      visitedViews.value = out
    }

    /** 数字医生为嵌套路由：外层 layout 须参与 keep-alive，与 ChatSession 等 leaf 并存 */
    function syncChatLayoutInCache() {
      const hasChat = visitedViews.value.some(
        (v) =>
          v.path === CHAT_HOME_TAG_PATH ||
          v.path === CHAT_SESSION_TAG_PATH ||
          v.path === '/chat' ||
          v.path.startsWith('/chat/')
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
        const isChatHome = tagPath === CHAT_HOME_TAG_PATH
        const isChatSession = tagPath === CHAT_SESSION_TAG_PATH
        visitedViews.value[index] = {
          ...prev,
          path: tagPath,
          fullPath: route.fullPath,
          query: route.query as Record<string, string | (string | null)[]>,
          name: routeName,
          meta: route.meta as Record<string, unknown>,
          title: isChatHome
            ? CHAT_TAG_TITLE_HOME
            : isChatSession
              ? CHAT_TAG_TITLE_SESSION
              : (route.meta.title as string) || prev.title,
          affix: route.meta.affix as boolean | undefined,
        }
        return
      }
      const isChatHome = tagPath === CHAT_HOME_TAG_PATH
      const isChatSession = tagPath === CHAT_SESSION_TAG_PATH
      visitedViews.value.push({
        fullPath: route.fullPath,
        path: tagPath,
        name: (route.name as string) || '',
        title: isChatHome
          ? CHAT_TAG_TITLE_HOME
          : isChatSession
            ? CHAT_TAG_TITLE_SESSION
            : (route.meta.title as string) || '',
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
      if (view.path === CHAT_HOME_TAG_PATH || view.path === CHAT_SESSION_TAG_PATH) {
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
