import DOMPurify from 'dompurify'

/**
 * Sanitize API-returned HTML fragments for knowledge card `content_preview` / citation `content`.
 */
export function sanitizeKnowledgePreviewHtml(raw: string | null | undefined): string {
  const s = String(raw ?? '')
  if (!s.trim()) return ''
  return DOMPurify.sanitize(s)
}
