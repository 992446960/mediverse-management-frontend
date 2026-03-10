# Element Plus → Ant Design Vue 4.x 组件映射对照表

## 表单类

| Element Plus | Ant Design Vue | 关键差异 |
|---|---|---|
| el-form / el-form-item | a-form / a-form-item | AntDV 用 `:model` + `name` 绑定验证；EP 用 `:model` + `prop` |
| el-input | a-input | AntDV `v-model:value`；EP `v-model` |
| el-select / el-option | a-select / a-select-option | AntDV options 可用 `:options` 数组；EP 只能用 slot |
| el-checkbox / el-checkbox-group | a-checkbox / a-checkbox-group | AntDV `v-model:checked`（单个）/ `v-model:value`（组） |
| el-radio / el-radio-group | a-radio / a-radio-group | AntDV `v-model:value` |
| el-switch | a-switch | AntDV `v-model:checked`；EP `v-model` |
| el-input-number | a-input-number | AntDV `v-model:value` |
| el-date-picker | a-date-picker / a-range-picker | AntDV 分开为单日/范围两个组件 |
| el-upload | a-upload | 回调参数结构不同，AntDV 用 `fileList` 数组管理 |
| el-slider | a-slider | AntDV `v-model:value` |
| el-rate | a-rate | AntDV `v-model:value` |

## 数据展示类

| Element Plus | Ant Design Vue | 关键差异 |
|---|---|---|
| el-table / el-table-column | a-table | AntDV 用 `columns` 数组配置列，而非 slot；`dataSource` 对应 EP `:data` |
| el-pagination | a-pagination | AntDV 事件为 `@change`，参数为 `(page, pageSize)` |
| el-tag | a-tag | AntDV `color` 支持预设值和自定义色 |
| el-badge | a-badge | AntDV 用 `count` 而非 `value` |
| el-progress | a-progress | AntDV `percent` 对应 EP `percentage` |
| el-tree | a-tree | AntDV 字段名：`treeData`、`fieldNames`；EP 用 `:data` + `props` |
| el-carousel | a-carousel | AntDV 基于 rc-slider，API 差异较大 |
| el-image | a-image | AntDV 内置预览组，支持 `a-image-preview-group` |
| el-timeline | a-timeline / a-timeline-item | 基本对应，颜色/图标配置方式不同 |
| el-statistic | a-statistic | 基本对应 |

## 反馈类

| Element Plus | Ant Design Vue | 关键差异 |
|---|---|---|
| el-dialog | a-modal | AntDV `v-model:open`（4.x）；EP `v-model:visible` |
| el-drawer | a-drawer | AntDV `v-model:open`；EP `v-model:visible` |
| el-tooltip | a-tooltip | AntDV `title` 为内容 prop；EP 用 slot `#content` 或 `content` prop |
| el-popover | a-popover | AntDV 分 `title` 和 `content`；触发方式 `trigger` 同 |
| el-popconfirm | a-popconfirm | AntDV 确认按钮事件为 `@confirm` |
| el-message | message（from antd） | AntDV 用 `import { message } from 'ant-design-vue'` |
| el-message-box | Modal.confirm / Modal.info | AntDV 用静态方法调用 |
| el-notification | notification | AntDV `import { notification } from 'ant-design-vue'` |
| el-loading（指令）| a-spin 组件 | AntDV 无全局 loading 指令，用 `<a-spin :spinning="loading">` 包裹 |
| el-alert | a-alert | `type` 值相同；AntDV 有 `showIcon` prop |
| el-result | a-result | 基本对应 |
| el-skeleton | a-skeleton | AntDV 子组件更丰富（a-skeleton-input、a-skeleton-avatar等）|

## 导航类

| Element Plus | Ant Design Vue | 关键差异 |
|---|---|---|
| el-menu / el-menu-item | a-menu / a-menu-item | AntDV 用 `items` 数组或 slot；选中用 `selectedKeys` |
| el-tabs / el-tab-pane | a-tabs / a-tab-pane | AntDV `v-model:activeKey`；EP `v-model` |
| el-breadcrumb | a-breadcrumb | AntDV 支持 `routes` 数组或 slot |
| el-steps / el-step | a-steps / a-step | AntDV `current` 从 0 开始（EP 也是）|
| el-dropdown | a-dropdown | AntDV 菜单用 `a-menu` 放入 `#overlay` slot |

## 布局类

| Element Plus | Ant Design Vue | 关键差异 |
|---|---|---|
| el-row / el-col | a-row / a-col | AntDV `span` 最大值同为 24；`gutter` 支持 `[水平, 垂直]` 数组 |
| el-card | a-card | AntDV 额外支持 `actions` slot（底部操作栏）|
| el-divider | a-divider | 基本对应 |
| el-space | a-space | 基本对应 |
| el-container / el-aside | a-layout / a-layout-sider | 命名不同，功能对应 |
| el-scrollbar | 无直接对应 | 使用原生 CSS overflow 或第三方滚动库 |

## 常见注意事项

1. **v-model 语法**：AntDV 4.x 大量使用 `v-model:value`、`v-model:checked`、`v-model:open` 等具名 v-model，而 EP 多用 `v-model` 默认绑定
2. **事件命名**：AntDV 多用 `@change`、`@update:xxx`；注意参数顺序可能不同
3. **样式覆盖**：AntDV 推荐用 CSS Variables（`--ant-*`）覆盖主题；EP 用 SCSS 变量
4. **Table 列定义**：AntDV `columns` 数组中的 `dataIndex` 对应 EP `el-table-column` 的 `prop`
5. **Form 验证**：AntDV rules 写法与 EP 基本相同，但触发方式 `trigger` 默认值可能不同
6. **图标**：AntDV 使用 `@ant-design/icons-vue`；EP 使用 `@element-plus/icons-vue`，需分别导入