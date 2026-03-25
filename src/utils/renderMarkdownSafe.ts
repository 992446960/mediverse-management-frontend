import { marked } from 'marked'
import DOMPurify from 'dompurify'

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/** marked + DOMPurify，与 BubbleRenderer 等聊天渲染一致（依赖全局 marked 配置如高亮） */
export function renderMarkdownSafe(raw: string | null | undefined): string {
  const s = String(raw ?? '')
  if (!s.trim()) {
    return ''
  }
  try {
    const result = marked.parse(s)
    const html = typeof result === 'string' ? result : String(result)
    return DOMPurify.sanitize(html)
  } catch {
    return DOMPurify.sanitize(escapeHtml(s))
  }
}
