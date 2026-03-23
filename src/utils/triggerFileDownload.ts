/** 生成适合作为浏览器「另存为」文件名的字符串 */
export function sanitizeDownloadFilename(name: string | undefined, fallback = 'download'): string {
  const base = name?.trim().split(/[/\\]/).pop()?.trim()
  if (!base) return fallback
  const cleaned = [...base.replace(/[<>:"/\\|?*]/g, '_')]
    .filter((ch) => {
      const c = ch.charCodeAt(0)
      return c >= 32 && c !== 127
    })
    .join('')
    .trim()
  return cleaned || fallback
}

/**
 * 通过 fetch 拉取文件并以 Blob 触发保存对话框，避免新开标签页。
 * 需目标 URL 对当前页面源允许 CORS（GET）；否则将抛出异常。
 */
export async function triggerFileDownload(url: string, filename: string): Promise<void> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
