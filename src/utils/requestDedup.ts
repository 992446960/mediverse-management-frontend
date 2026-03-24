import type { InternalAxiosRequestConfig } from 'axios'

/**
 * 防重复提交模块
 *
 * 基于节流函数实现：同一请求首次立即放行，冷却期（默认 1s）内的后续相同请求
 * 直接拦截并提示。每次被拦截都会刷新冷却期，直到停止操作超过 1s 才可再次提交。
 *
 * 跳过方式：config.headers.repeatSubmit = false
 */

/** 不参与校验的 URL 关键字 */
const EXCLUDE_URLS = ['/auth/login', '/auth/refresh', '/auth/logout']

/** 冷却时间（ms） */
const INTERVAL = 1000

/**
 * 创建一个「首次立即执行」的节流器
 * - 首次调用：执行 fn 并进入冷却
 * - 冷却期内再次调用：刷新冷却计时，不执行 fn，返回 false
 * - 冷却期结束后调用：视为新的首次
 */
function createThrottle(interval: number) {
  const lastMap = new Map<string, number>()

  return (key: string): boolean => {
    const now = Date.now()
    const last = lastMap.get(key)

    if (last != null && now - last < interval) {
      // 冷却期内 → 刷新时间戳，拦截
      lastMap.set(key, now)
      return false
    }

    // 首次 或 冷却已过 → 放行
    lastMap.set(key, now)
    return true
  }
}

const throttle = createThrottle(INTERVAL)

/** 根据请求信息生成唯一标识 */
function generateKey(config: InternalAxiosRequestConfig): string {
  const { method, url, data, params } = config
  const paramsPart =
    params != null && typeof params === 'object' && Object.keys(params).length > 0
      ? JSON.stringify(params)
      : ''
  const body =
    data instanceof FormData
      ? 'FormData'
      : typeof data === 'object'
        ? JSON.stringify(data)
        : String(data ?? '')
  return `${method}:${url}:${paramsPart}:${body}`
}

function isExcluded(url: string): boolean {
  return EXCLUDE_URLS.some((exclude) => url.includes(exclude))
}

/**
 * 在请求拦截器中调用。
 * 被节流拦截时抛出 Error，由 axios 错误拦截器统一提示。
 */
export function checkRepeatSubmit(config: InternalAxiosRequestConfig): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((config.headers as any)?.repeatSubmit === false) return
  if (isExcluded(config.url || '')) return

  const key = generateKey(config)

  if (!throttle(key)) {
    throw new Error('数据正在处理，请勿重复提交')
  }
}
