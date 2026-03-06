# TableFilter 表格筛选栏

配置化筛选项（输入框、下拉）+ 搜索 / 重置按钮，基于 Ant Design Vue（a-input、a-select、a-button、a-space）实现。

## Props

| 属性          | 类型                                          | 默认   | 说明                                                                                 |
| ------------- | --------------------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| fields        | TableFilterFieldConfig[]                      | -      | 筛选项配置                                                                           |
| modelValue    | Record<string, string \| number \| undefined> | -      | 当前筛选值（v-model）                                                                |
| searchText    | string                                        | '搜索' | 搜索按钮文案                                                                         |
| resetText     | string                                        | '重置' | 重置按钮文案                                                                         |
| title         | string                                        | -      | 可选，标题区文案（如「科室管理」）                                                   |
| primaryAction | TableFilterPrimaryAction                      | -      | 可选，标题区主操作按钮（如「新增科室」），配合 #primaryActionIcon 与 @primary-action |

### TableFilterPrimaryAction

- `text`: 按钮文案
- `permission?`: v-permission 角色列表，如 `['sysadmin', 'org_admin']`

### TableFilterFieldConfig

- `key`: 字段名，与 modelValue 对应
- `label`: 标签，如「科室名称:」
- `type`: 'input' | 'select'
- `placeholder?`: 输入框占位符
- `options?`: select 的选项 `{ label, value }[]`
- `inputClass?`: 控件宽度等类名，如 `w-64`、`min-w-[140px]`

## Events

- **update:modelValue**: 筛选值变化时
- **search**: 点击搜索（输入框 Enter、下拉 change 也会触发）
- **reset**: 点击重置（会先清空为初始值再 emit）
- **primary-action**: 点击主操作按钮时

## Slots

- **primaryActionIcon**: 主操作按钮左侧图标（如 `<PlusOutlined />`）

## 使用示例

带标题与主操作（科室管理页）：

```vue
<TableFilter
  v-model="filterState"
  :title="t('dept.title')"
  :primary-action="{ text: t('dept.addDept'), permission: ['sysadmin', 'org_admin'] }"
  :fields="filterFields"
  @search="onFilterSearch"
  @reset="onFilterReset"
  @primary-action="openCreateForm"
>
  <template #primaryActionIcon>
    <PlusOutlined />
  </template>
</TableFilter>
```

仅筛选栏（不传 title / primaryAction 即可）。filterFields 示例见 `views/admin/Departments/index.vue`。按钮内 icon 与文字已做垂直居中对齐。
