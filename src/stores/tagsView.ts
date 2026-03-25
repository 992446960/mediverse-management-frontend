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

export const useTagsViewStore = defineStore(
  'tagsView',
  () => {
    const visitedViews = ref<TagView[]>([])
    /** cachedViews 不持久化，刷新后由 restoreCachedViews 从 visitedViews 重建 */
    const cachedViews = ref<string[]>([])

    /** 刷新页面后根据已持久化的 visitedViews 重建 cachedViews */
    function restoreCachedViews() {
      cachedViews.value = visitedViews.value
        .filter((v) => v.name && !v.meta?.noCache)
        .map((v) => v.name)
    }

    function addVisitedView(route: RouteLocationNormalized) {
      if (route.meta.hidden) return
      const index = visitedViews.value.findIndex((v) => v.path === route.path)
      if (index >= 0) {
        visitedViews.value[index] = {
          ...visitedViews.value[index],
          fullPath: route.fullPath,
          query: route.query as Record<string, string | (string | null)[]>,
        }
        return
      }
      visitedViews.value.push({
        fullPath: route.fullPath,
        path: route.path,
        name: (route.name as string) || '',
        title: (route.meta.title as string) || '',
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
      const index = cachedViews.value.indexOf(view.name)
      if (index >= 0) cachedViews.value.splice(index, 1)
    }

    function addView(route: RouteLocationNormalized) {
      addVisitedView(route)
      addCachedView(route)
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
      return [...visitedViews.value]
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
