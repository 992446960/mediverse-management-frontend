import type { RouteLocationMatched, RouteLocationNormalizedLoaded, RouteParams } from 'vue-router'
import type { MenuConfig } from '@/config/menu'

export interface BreadcrumbItem {
  titleKey: string
  href: string
  linkable: boolean
}

/** 侧栏菜单配置中出现的「带 path 的项」——目录节点无 path，仅叶子可导航 */
function collectMenuLeafPaths(items: MenuConfig[]): Set<string> {
  const out = new Set<string>()
  function walk(nodes: MenuConfig[]) {
    for (const n of nodes) {
      if (n.path) out.add(n.path)
      if (n.children) walk(n.children)
    }
  }
  walk(items)
  return out
}

/** 去掉与父级同 title 的空 path 子路由（如 /chat 下 path:'' 与父级同为「数字医生体验」） */
function dedupeMatchedForBreadcrumb(matched: RouteLocationMatched[]): RouteLocationMatched[] {
  return matched.filter((record, index) => {
    if (!record.meta?.title) return false
    if (record.path === '' && index > 0) {
      const prev = matched[index - 1]
      if (prev?.meta?.title === record.meta?.title) return false
    }
    return true
  })
}

function hrefForMatchedPrefix(
  matched: RouteLocationMatched[],
  endIndex: number,
  params: RouteParams
): string {
  let path = ''
  for (let i = 0; i <= endIndex; i++) {
    const record = matched[i]
    if (!record) continue
    const p = record.path
    if (p === '') continue
    if (p.startsWith('/')) path = p
    else path = path.replace(/\/$/, '') + '/' + p
  }
  for (const key of Object.keys(params)) {
    const val = params[key]
    if (typeof val === 'string' && path.includes(`:${key}`)) {
      path = path.replace(`:${key}`, val)
    }
  }
  return path
}

export function buildBreadcrumbItems(
  route: RouteLocationNormalizedLoaded,
  menuConfig: MenuConfig[]
): BreadcrumbItem[] {
  const leafPaths = collectMenuLeafPaths(menuConfig)
  const matched = dedupeMatchedForBreadcrumb(route.matched.filter((r) => r.meta?.title))
  const n = matched.length

  return matched.map((record, index) => {
    const titleKey = record.meta!.title as string
    const href = hrefForMatchedPrefix(matched, index, route.params)
    const isLast = index === n - 1
    const meta = record.meta as { breadcrumbLink?: boolean }

    let linkable = false
    if (!isLast && meta.breadcrumbLink !== false) {
      if (meta.breadcrumbLink === true) linkable = true
      else if (leafPaths.has(href)) linkable = true
    }

    return { titleKey, href, linkable }
  })
}
