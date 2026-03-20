import type { FileListItem } from '@/types/knowledge'

const PREFIX = 'knowledge:previewFile:'

/** 列表进入预览前写入，避免 Vue Router 未将 push state 保留在 history.state 导致预览页无数据 */
export function stashKnowledgePreviewFile(record: FileListItem): void {
  try {
    sessionStorage.setItem(PREFIX + record.id, JSON.stringify(record))
  } catch {
    /* quota / 隐私模式等 */
  }
}

export function readKnowledgePreviewFile(fileId: string): FileListItem | undefined {
  if (!fileId) return undefined
  try {
    const raw = sessionStorage.getItem(PREFIX + fileId)
    if (!raw) return undefined
    return JSON.parse(raw) as FileListItem
  } catch {
    return undefined
  }
}
