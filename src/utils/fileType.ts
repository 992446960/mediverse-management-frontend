import router from '@/router'

export type FileCategory =
  | 'pdf'
  | 'docx'
  | 'xlsx'
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'unknown'

const EXT_MAP: Record<string, FileCategory> = {
  pdf: 'pdf',
  docx: 'docx',
  xlsx: 'xlsx',
  txt: 'text',
  md: 'text',
  json: 'text',
  jsonl: 'text',
  csv: 'text',
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  bmp: 'image',
  mp4: 'video',
  webm: 'video',
  ogv: 'video',
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  aac: 'audio',
}

/** 与路由 `routes.ts` 中 name 保持一致 */
export const UNIVERSAL_PREVIEW_ROUTE_NAME = 'UniversalFilePreview'

export function extractExtension(source: string): string {
  const pathOnly = source.split(/[?#]/)[0] ?? ''
  const base = pathOnly.split(/[/\\]/).pop() ?? ''
  const dot = base.lastIndexOf('.')
  if (dot <= 0) return ''
  return base.slice(dot + 1).toLowerCase()
}

export function getFileCategory(url: string, fileName?: string): FileCategory {
  const extFromName = fileName ? extractExtension(fileName) : ''
  if (extFromName && EXT_MAP[extFromName]) return EXT_MAP[extFromName]
  const extFromUrl = extractExtension(url)
  if (extFromUrl && EXT_MAP[extFromUrl]) return EXT_MAP[extFromUrl]
  return 'unknown'
}

/** 供 TextFileViewer 的 `file-type`（小写扩展名，缺省为 txt） */
export function getTextViewerFileType(fileName: string | undefined, url: string): string {
  const ext = fileName ? extractExtension(fileName) : extractExtension(url)
  return ext || 'txt'
}

export function isAllowedPreviewUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * 在新标签页打开通用文件预览（含 `import.meta.env.BASE_URL` 子路径兼容）。
 */
export function openFilePreview(fileUrl: string, fileName?: string) {
  const query: Record<string, string> = { url: fileUrl }
  if (fileName) query.name = fileName
  const href = router.resolve({ name: UNIVERSAL_PREVIEW_ROUTE_NAME, query }).href
  window.open(href, '_blank')
}
