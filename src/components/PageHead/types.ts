import type { Component } from 'vue'

export interface PageHeadBtn {
  /** 按钮文案 */
  text: string
  /** 按钮类型，映射 AntDV a-button type：'primary' | 'default' | 'dashed' | 'text' | 'link' */
  type?: string
  /** Ant Design Icons Vue 图标组件 */
  icon?: Component
  /** 点击行为回调 */
  handle?: () => void
  /** 权限标识数组，通过 v-permission 指令控制显隐 */
  permission?: string[]
  /** 非权限按钮的显隐开关，仅无 permission 时生效 */
  show?: boolean
}

export interface PageHeadConfig {
  /** 左侧标题文案，缺失时标题区不显示 */
  title?: string
  /** 标题旁 Tooltip 提示文案，仅当 title 存在时有意义 */
  intro?: string
  /** 是否显示返回入口，点击执行 router.go(-1) */
  backLeft?: boolean
  /** 右侧按钮列表，无值时不显示按钮栏 */
  btns?: PageHeadBtn[]
  /** Tabs 默认激活值，仅初始化时读取一次 */
  defaultTab?: string | number
  /** Tabs 数据源 */
  tabsOptions?: Array<{ label: string; value: string | number }>
  /** Tabs 切换回调；新版改进：回调接收当前 activeKey 作为参数 */
  tabChangeHandle?: (activeKey: string | number) => void
}
