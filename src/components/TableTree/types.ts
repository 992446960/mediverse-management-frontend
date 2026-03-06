/**
 * 树节点（支持多级）
 * 默认不展示图标；仅当传入 icon 且在 TableTree 内置 map 中有对应组件时才展示
 */
export interface TableTreeNode {
  key: string
  label: string
  children?: TableTreeNode[]
  /** 可选图标名，需为 TableTree icons 中支持的 key，如 'bank'、'apartment' */
  icon?: string
}

/**
 * 节点点击 payload
 */
export interface TableTreeClickPayload {
  key: string
  label: string
  /** 根节点为 root，子节点为 branch */
  level: 'root' | 'branch'
}
