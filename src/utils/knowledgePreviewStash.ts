import type { FileListItem, OwnerType } from '@/types/knowledge'

const PREFIX = 'knowledge:previewFile:'

export interface KnowledgePreviewContext {
  file: FileListItem
  ownerType?: OwnerType
  ownerId?: string
}

function isKnowledgePreviewContext(value: unknown): value is KnowledgePreviewContext {
  return (
    value != null &&
    typeof value === 'object' &&
    'file' in value &&
    (value as { file?: unknown }).file != null
  )
}

/** 列表进入预览前写入，避免 Vue Router 未将 push state 保留在 history.state 导致预览页无数据 */
export function stashKnowledgePreviewFile(
  record: FileListItem,
  context?: { ownerType?: OwnerType; ownerId?: string }
): void {
  try {
    sessionStorage.setItem(
      PREFIX + record.id,
      JSON.stringify({
        file: record,
        ownerType: context?.ownerType,
        ownerId: context?.ownerId,
      } satisfies KnowledgePreviewContext)
    )
  } catch {
    /* quota / 隐私模式等 */
  }
}

export function readKnowledgePreviewContext(fileId: string): KnowledgePreviewContext | undefined {
  if (!fileId) return undefined
  try {
    const raw = sessionStorage.getItem(PREFIX + fileId)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as unknown
    if (isKnowledgePreviewContext(parsed)) return parsed
    return { file: parsed as FileListItem }
  } catch {
    return undefined
  }
}

export function readKnowledgePreviewFile(fileId: string): FileListItem | undefined {
  return readKnowledgePreviewContext(fileId)?.file
}
