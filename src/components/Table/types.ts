import type { ColumnsType } from 'ant-design-vue/es/table'

/**
 * 与 Ant Design Vue Table 列定义兼容，便于业务传入 columns 时获得类型提示。
 * 使用泛型时可约束行数据类型，例如 ProTableProps<UserListItem>。
 */
export type ProTableColumn<RecordType = Record<string, unknown>> = ColumnsType<RecordType>[number]

/**
 * 操作列按钮配置（数据驱动，无需插槽）
 */
export interface ProTableActionBtn<RecordType = Record<string, unknown>> {
  text: string
  dynamicText?: (record: RecordType) => string
  handle: (record: RecordType) => void
  /** 危险操作可设 popconfirm 文案，点击后二次确认再执行 handle */
  popconfirm?: string
  popconfirmType?: 'danger' | 'primary'
  /** 按钮是否为危险操作（红色样式） */
  danger?: boolean
  btnDisabled?: (record: RecordType) => boolean
  btnIsShow?: (record: RecordType) => boolean
}

/**
 * 列扩展字段：在 Ant Design column 上可选挂载，用于数据驱动渲染单元格
 * 与 ProTableColumn 一起使用：columns 项可带这些字段，ProTable 按 cellType 渲染
 */
export interface ProTableColumnExt<RecordType = Record<string, unknown>> {
  cellType?: 'text' | 'link' | 'tag' | 'slot' | 'actions' | 'status' | 'date'
  /** link：点击文案 */
  linkText?: (record: RecordType) => string
  linkFn?: (record: RecordType) => void
  linkDisabled?: (record: RecordType) => boolean
  /** tag：a-tag 类型与文案 */
  tagType?: (record: RecordType) => string
  tagText?: (record: RecordType) => string
  /** slot：插槽名，交予 #bodyCell 或具名插槽 */
  slotName?: string
  /** actions：操作按钮列表 */
  btns?: ProTableActionBtn<RecordType>[]
  /** status：状态点 + 文案，取 record[dataIndex] 与 activeValue 比较 */
  statusLabels?: { active: string; inactive: string }
  activeValue?: string
  /** date：日期格式化，取 record[dataIndex] 为 ISO 字符串 */
  dateFormat?: string
}

/**
 * 工具栏按钮配置（标题栏右侧）
 * 每项带 handle，点击时直接调用，无需单独 onToolClick / tool-click
 */
export interface ProTableToolItem {
  key: string
  /** 图标名，与 ProTable 内置 map 一致：reload / download / setting */
  icon: 'reload' | 'download' | 'setting'
  /** 提示文案 / aria-label */
  title: string
  /** 点击回调 */
  handle: () => void
  disabled?: boolean
}

/**
 * 表格顶栏配置（条数、更新时间等，参考数据驱动展示）
 */
export interface ProTableBarConfig {
  /** 是否隐藏顶栏（仅当有 title 时顶栏存在） */
  hide?: boolean
  /** 数据最后更新时间文案，如 "2024-01-15 10:30" */
  updateTime?: string
  /** 总条数文案，默认 (n) => `共 ${n} 条` */
  totalLabel?: (total: number) => string
  /** 是否在顶栏「条数」后方展示刷新按钮（紧跟数据最后更新时间） */
  showRefresh?: boolean
  /** 点击刷新时的回调，与 showRefresh 搭配使用 */
  onRefresh?: () => void | Promise<void>
}

/**
 * 分页配置（受控）
 * - 当 pagination 为 false 时由外部自行分页或不分页
 * - 当为对象时支持 current、pageSize、total 及 onChange
 */
export interface ProTablePagination {
  current: number
  pageSize: number
  total: number
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  /** 受控：页码或 pageSize 变化时由父组件请求数据并更新 current/pageSize/total */
  onChange?: (page: number, pageSize: number) => void
}
