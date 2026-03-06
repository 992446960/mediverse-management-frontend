export type OwnerType = 'personal' | 'dept' | 'org'
export type FileStatus = 'uploading' | 'parsing' | 'extracting' | 'indexing' | 'done' | 'failed'
export type CardType = 'evidence' | 'rule' | 'experience'

export interface KnowledgeFile {
  id: string
  name: string
  size: number
  type: string // mime type
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
