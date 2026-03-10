export interface PageTableOperationBtn {
  /** 按钮文案 */
  text: string
  /** 动态文案 */
  dynamicText?: (row: Record<string, unknown>) => string
  /** 按钮形态：'popconfirm' | 'popover' | 默认 link button */
  type?: string
  /** a-button 的 type：primary | default | dashed | link | text，默认 primary */
  buttonType?: 'primary' | 'default' | 'dashed' | 'link' | 'text'
  /** 按钮图标（Vue 组件，如 @ant-design/icons-vue 的组件） */
  icon?: unknown
  /** 根据行数据动态返回图标组件 */
  dynamicIcon?: (row: Record<string, unknown>) => unknown
  /** 按钮字体/图标颜色：CSS 颜色或 'danger' | 'warning' | 'success'，link/text 时生效 */
  color?: string
  /** 根据行数据动态返回颜色（取值同 color） */
  dynamicColor?: (row: Record<string, unknown>) => string | undefined
  /** 禁用逻辑 */
  btnDisabled?: (row: Record<string, unknown>) => boolean
  /** 是否显示 */
  btnIsShow?: (row: Record<string, unknown>) => boolean
  /** 点击行为 */
  handle?: (row: Record<string, unknown>, index?: number) => void
  /** 二次确认文案 (type === 'popconfirm') */
  popconfirmTitle?: string
  /** 动态确认文案 (type === 'popconfirm') */
  dynamicPopconfirmTitle?: (row: Record<string, unknown>) => string
  /** 确认框确认按钮类型 */
  popconfirmType?: string
  /** 取消回调 (type === 'popconfirm') */
  cancel?: (row: Record<string, unknown>, index?: number) => void
  /** 更多操作列表 (type === 'popover') */
  moreList?: PageTableOperationBtn[]
}

export interface PageTableColumnConfig {
  /** 列标题 */
  label?: string
  /** 数据字段名 */
  prop?: string
  /** 列类型：selection | index | scope | slot | operation | (默认 text) */
  type?: string
  /** 列最小宽度 */
  width?: number | string
  /** 固定列 */
  fixed?: boolean | 'left' | 'right'
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right'
  /** 超长内容 Tooltip 提示 */
  showOverflowTooltip?: boolean
  /** 文本格式化函数 */
  formatter?: (row: Record<string, unknown>) => string
  /** 开启自定义排序 */
  sortable?: boolean
  /** 列设置中是否锁定 */
  lock?: boolean
  /** 多选保留（仅 selection 生效） */
  reserveSelection?: boolean
  /** 多选禁用逻辑（仅 selection 生效） */
  selectDisabled?: (row: Record<string, unknown>) => boolean
  /** 序号格式化（仅 index 生效） */
  indexMethod?: (index: number) => number | string
  /** scope 列渲染分支 */
  scopeType?: '_link' | '_tag' | '_tags' | '_switch' | '_image' | '_numInput'
  /** slot 列插槽名 */
  slotName?: string
  /** 操作列按钮配置 */
  btns?: PageTableOperationBtn[]
  /** 列是否可见（列设置功能使用） */
  _visible?: boolean
  /** 列默认可见状态 */
  _defaultVisible?: boolean
  /** 列当前排序 */
  _index?: number
  /** 列默认排序 */
  _defaultIndex?: number
  /** 列唯一标识 */
  _id?: string | number
  /** _link: 链接点击回调 */
  linkFn?: (row: Record<string, unknown>) => void
  /** _link: 禁用判断 */
  linkDisabled?: (row: Record<string, unknown>) => boolean
  /** _tag: 标签类型 */
  tagType?: (row: Record<string, unknown>) => string
  /** _tag: 标签文案 */
  tagText?: (row: Record<string, unknown>) => string
  /** _switch: 开关切换回调 */
  switchFn?: (value: boolean, row: Record<string, unknown>) => void
  /** _image: 图片宽度 */
  imageWidth?: number | string
  /** _image: 图片高度 */
  imageHeight?: number | string
  /** _numInput: 数字上限字段名 */
  max?: string
}

export interface PageTableConfig {
  /** 表格加载态 */
  isLoading?: boolean
  /** 最后更新时间 */
  updateTime?: string | number | Date
  /** 空状态文案，默认 '暂无相关数据' */
  emptyText?: string
  /** 总条数，> 0 时显示分页 */
  total?: number
  /** 行唯一键字段名，默认 'id' */
  rowKey?: string
  /** 是否隐藏顶部工具栏 */
  hideTableBar?: boolean
  /** 是否显示边框 */
  border?: boolean
  /** 每页条数选项，默认 [20, 50, 100, 200] */
  paginationSizes?: number[]
  /** 固定表格高度（传入时跳过自动高度计算） */
  tableHeight?: number | string
  /** 计算自适应高度时底部留白，默认 100 */
  tableMarginBottom?: number
}
