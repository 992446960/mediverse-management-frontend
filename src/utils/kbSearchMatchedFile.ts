import type { MatchedFile } from '@/api/knowledgeSearch'
import type { FileListItem, FileStatus } from '@/types/knowledge'

/** 知识库检索 matched_files 转为预览页 stash 所需的最小 FileListItem */
export function fileListItemFromKbMatchedFile(m: MatchedFile): FileListItem {
  const name = m.file_name
  const ext = name.includes('.') ? (name.split('.').pop()?.toLowerCase() ?? '') : ''
  const now = new Date().toISOString()
  return {
    id: m.file_id,
    file_name: name,
    file_type: ext || 'unknown',
    file_size: 0,
    dir_id: '',
    dir_name: '',
    status: 'done' as FileStatus,
    file_url: undefined,
    storage_url: undefined,
    parsed_file_url: undefined,
    error_msg: null,
    auto_category_suggestion: null,
    auto_category_name: null,
    knowledge_card_count: 0,
    created_by: '',
    created_by_name: '',
    created_at: now,
    updated_at: now,
  }
}
