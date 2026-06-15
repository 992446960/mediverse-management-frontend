import api from '@/api'
import { message } from 'ant-design-vue'
import { getI18nMessage } from '@/utils/i18nMessage'

export async function downloadFile(
  url: string,
  params?: Record<string, unknown>,
  filename?: string,
  method: 'get' | 'post' = 'get'
): Promise<void> {
  try {
    const response =
      method === 'get'
        ? await api.get(url, { params, responseType: 'blob' })
        : await api.post(url, params, { responseType: 'blob' })

    const blob = response.data as Blob

    if (blob.type === 'application/json') {
      const text = await blob.text()
      try {
        const json = JSON.parse(text)
        message.error(json.message || getI18nMessage('common.downloadFallback', '下载失败'))
      } catch {
        message.error(getI18nMessage('common.downloadFallback', '下载失败'))
      }
      return
    }

    if (!filename) {
      const disposition = response.headers?.['content-disposition'] || ''
      const match = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/)
      if (match) {
        filename = decodeURIComponent(match[1])
      } else {
        filename = url.split('/').pop() || 'download'
      }
    }

    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : getI18nMessage('common.downloadFallback', '下载失败')
    message.error(msg)
    throw error
  }
}
