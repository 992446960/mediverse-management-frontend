import type { PaginationParams } from './api'

export type OwnerType = 'personal' | 'dept' | 'org'
export type FileStatus = 'uploading' | 'parsing' | 'extracting' | 'indexing' | 'done' | 'failed'
export type CardType = 'evidence' | 'rule' | 'experience'

/** 目录树节点 */
export interface DirectoryNode {
  id: string
  name: string
  is_default: boolean
  sort_order: number
  file_count: number
  children?: DirectoryNode[]
}

/** 上传文件接口返回（单文件上传响应） */
export interface UploadFileResult {
  id: string
  file_name: string
  file_size: number
  status: FileStatus
  created_at: string
}

/** 文件列表项 */
export interface FileListItem {
  id: string
  file_name: string
  file_type: string
  file_size: number
  dir_id: string
  dir_name: string
  status: FileStatus
  file_url?: string
  parsed_file_url?: string | null
  error_msg: string | null
  auto_category_suggestion: string | null
  auto_category_name: string | null
  knowledge_card_count: number
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
}

/** 文件关联的知识卡（预览侧栏用） */
export interface FileCard {
  id: string
  type: CardType
  title: string
  tags: string[]
  online_status?: string
  confidence?: number
}

/** 文件处理状态响应 */
export interface FileStatusResponse {
  id: string
  status: FileStatus
  progress: {
    current_step: FileStatus
    steps: FileStatus[]
    step_index: number
  }
  error_msg: string | null
}

/** 文件列表请求参数 */
export interface FileListParams extends PaginationParams {
  dir_id?: string
  status?: FileStatus
}

/** 创建目录请求负载 */
export interface CreateDirectoryPayload {
  parent_id: string | null
  name: string
  sort_order?: number
}

/** 状态渲染配置 */
export const FILE_STATUS_CONFIG: Record<FileStatus, { color: string; label: string }> = {
  uploading: { color: 'blue', label: '上传中...' },
  parsing: { color: 'cyan', label: '正在解析文档...' },
  extracting: { color: 'geekblue', label: '正在提取知识...' },
  indexing: { color: 'purple', label: '正在建立索引...' },
  /** 已完成：#53b614 */
  done: { color: '#53b614', label: '已完成' },
  failed: { color: 'error', label: '处理失败' },
}

// 保持向下兼容
export interface KnowledgeFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  status: FileStatus
  error_message?: string
  owner_type: OwnerType
  owner_id: string
  uploaded_by: string
  created_at: string
  updated_at: string
}

export interface KnowledgeCard {
  id: string
  title: string
  content: string
  type: CardType
  tags: string[]
  source_file_id?: string
  owner_type: OwnerType
  owner_id: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface DirectoryTree {
  id: string
  name: string
  type: 'file' | 'folder'
  children?: DirectoryTree[]
}
