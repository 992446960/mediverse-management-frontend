import type { AxiosError } from 'axios'
import type { ComposerTranslation } from 'vue-i18n'
import type { ApiResponse } from '@/types/api'

/** 判断是否为 Axios 常见英文占位文案，需映射为 i18n */
function isAxiosGenericEnglishMessage(msg: string): boolean {
  if (!msg.trim()) return true
  if (msg === 'Network Error') return true
  if (msg === 'Error') return true
  if (/^Request failed/i.test(msg)) return true
  if (/timeout/i.test(msg)) return true
  return false
}

/**
 * 将上传失败错误转为用户可读文案（优先后端 message，英文网络/状态码映射为中文）
 */
export function getUploadErrorMessage(err: unknown, t: ComposerTranslation): string {
  const ax = err as AxiosError<ApiResponse | Record<string, unknown>>
  const data = ax.response?.data
  if (data && typeof data === 'object' && data !== null && 'message' in data) {
    const m = String((data as ApiResponse).message ?? '').trim()
    if (m) return m
  }

  const rawMsg = ax.message?.trim() ?? ''
  if (rawMsg && !isAxiosGenericEnglishMessage(rawMsg)) {
    return rawMsg
  }

  const status = ax.response?.status
  const code = ax.code

  if (code === 'ECONNABORTED' || /timeout/i.test(rawMsg)) {
    return t('knowledge.uploadErrorTimeout')
  }
  if (code === 'ERR_NETWORK' || rawMsg === 'Network Error') {
    return t('knowledge.uploadErrorNetwork')
  }

  const scm = /status code (\d+)/i.exec(rawMsg)
  if (scm?.[1]) {
    return t('knowledge.uploadErrorHttp', { status: scm[1] })
  }
  if (status != null) {
    return t('knowledge.uploadErrorHttp', { status: String(status) })
  }

  return t('knowledge.uploadFailed')
}
