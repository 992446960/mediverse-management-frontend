import type { InternalAxiosRequestConfig } from 'axios'

/**
 * 请求去重模块
 * 原理：对 POST/PUT/PATCH/DELETE 请求，用 [method, url, body] 生成唯一 key
 *       若同 key 请求已在进行中，取消前一个请求，让新请求通过
 */

const pendingMap = new Map<string, AbortController>()

/** 不参与去重的 URL 关键字 */
const EXCLUDE_URLS = ['/auth/login', '/auth/refresh', '/auth/logout']

/** 仅对变更类请求去重 */
const DEDUP_METHODS = ['post', 'put', 'patch', 'delete']

function generateKey(config: InternalAxiosRequestConfig): string {
  const { method, url, data } = config
  const body = typeof data === 'string' ? data : JSON.stringify(data ?? '')
  return `${method}:${url}:${body}`
}

function isExcluded(config: InternalAxiosRequestConfig): boolean {
  const url = config.url || ''
  return EXCLUDE_URLS.some((exclude) => url.includes(exclude))
}

function shouldSkip(config: InternalAxiosRequestConfig): boolean {
  return (
    !DEDUP_METHODS.includes(config.method?.toLowerCase() || '') ||
    isExcluded(config) ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (config as any).skipDedup === true
  )
}

/**
 * 在请求拦截器中调用：
 * 1. 如果已有相同请求在 pending 中 → 取消前一个
 * 2. 为当前请求注册新的 AbortController
 */
export function addPending(config: InternalAxiosRequestConfig): void {
  if (shouldSkip(config)) return

  const key = generateKey(config)

  // 取消前一个相同请求（如果存在）
  if (pendingMap.has(key)) {
    const prevController = pendingMap.get(key)!
    prevController.abort('Duplicate request cancelled')
    pendingMap.delete(key)
  }

  // 为当前请求注册 AbortController
  const controller = new AbortController()
  config.signal = controller.signal
  pendingMap.set(key, controller)
}

/**
 * 在响应/错误拦截器中调用：移除已完成的 pending 请求
 */
export function removePending(config: InternalAxiosRequestConfig): void {
  if (shouldSkip(config)) return

  const key = generateKey(config)
  pendingMap.delete(key)
}

/**
 * 清除所有 pending 请求（可在路由切换时调用）
 */
export function clearAllPending(): void {
  pendingMap.forEach((controller) => {
    controller.abort('Route changed, pending requests cleared')
  })
  pendingMap.clear()
}
