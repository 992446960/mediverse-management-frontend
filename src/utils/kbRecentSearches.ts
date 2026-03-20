/** 知识库搜索入口页「最近搜索」本地缓存（与后端搜索会话列表无关） */
const STORAGE_KEY = 'kb-recent-search-queries'
const MAX_ITEMS = 8

function canUseStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

export function getKbRecentSearches(): string[] {
  if (!canUseStorage()) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

function persist(list: string[]): void {
  if (!canUseStorage()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

/** 记录一次搜索（去重、新记录置顶、最多 MAX_ITEMS 条） */
export function addKbRecentSearch(query: string): void {
  const q = query.trim()
  if (!q) return
  const list = getKbRecentSearches().filter((x) => x !== q)
  list.unshift(q)
  persist(list.slice(0, MAX_ITEMS))
}

export function removeKbRecentSearch(query: string): void {
  persist(getKbRecentSearches().filter((x) => x !== query))
}

export function clearKbRecentSearches(): void {
  persist([])
}
