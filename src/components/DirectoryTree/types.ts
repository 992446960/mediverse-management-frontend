import type { DirectoryNode } from '@/types/knowledge'

export interface DirectoryTreeNode extends DirectoryNode {
  key: string
  label: string
  children?: DirectoryTreeNode[]
}

export interface DirectoryTreeClickPayload {
  key: string
  label: string
  level: 'virtual' | 'root' | 'branch'
  data?: DirectoryNode
}
