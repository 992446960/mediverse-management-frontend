# PageTree 通用树形侧栏

参考「全部机构」布局：卡片容器、标题、搜索框、可展开的树列表（根节点 + 子节点连线样式）。

## Props

| 属性              | 类型                          | 默认       | 说明                                             |
| ----------------- | ----------------------------- | ---------- | ------------------------------------------------ |
| title             | string                        | -          | 标题，如「全部机构」                             |
| searchPlaceholder | string                        | -          | 搜索框占位符，不传则不显示搜索                   |
| treeData          | TableTreeNode[]               | -          | 树数据                                           |
| selectedKey       | string                        | ''         | 当前选中节点 key                                 |
| loading           | boolean                       | false      | 加载态                                           |
| fetchData         | () => void \| Promise<void> | -          | 刷新回调；传入时展示标题右侧刷新按钮，点击后调用 |
| refreshTitle      | string                        | '刷新'     | 刷新按钮的 title 文案                            |
| emptyText         | string                        | '暂无数据' | 无数据/无匹配结果文案                            |
| maxHeight         | string                        | 见下       | 容器高度（默认 `100vh - header - content margin`，与 MainLayout 一致，保证内部滚动） |

### TableTreeNode

- `key`: 节点唯一 key
- `label`: 展示文案
- `children?`: 子节点（可选，有则显示展开箭头与连线）
- `icon?`: 可选。仅当传入且在组件内置 map 中有对应图标时才展示；不传则不展示图标。支持 key：`bank`、`apartment`（见 `icons.ts`）

## Events

- **node-click**: `(payload: { key, label, level: 'root' | 'branch' })`，点击节点时触发。

## 使用示例

```vue
<PageTree
  title="全部机构"
  search-placeholder="搜索机构名称"
  :tree-data="treeData"
  :selected-key="selectedKey"
  :loading="treeLoading"
  :fetch-data="loadTree"
  @node-click="onNodeClick"
/>
```

树数据可由 API 机构/科室树转换而来，见 `views/admin/Departments/index.vue`。

