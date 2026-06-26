import type { Component } from 'vue'

export type BatchActionColor = 'danger' | 'warning' | 'success' | string

export interface BatchActionToolbarAction {
  text: string
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text'
  icon?: Component
  color?: BatchActionColor
  disabled?: boolean
  show?: boolean
  handle?: () => void
}
