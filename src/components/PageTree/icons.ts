import type { Component } from 'vue'
import { BankOutlined, ApartmentOutlined, TeamOutlined, DownOutlined } from '@ant-design/icons-vue'

/** 树节点图标名 -> 组件，供 TableTree 渲染节点图标 */
export const tableTreeIconMap: Record<string, Component> = {
  bank: BankOutlined,
  apartment: ApartmentOutlined,
  team: TeamOutlined,
  down: DownOutlined,
}

