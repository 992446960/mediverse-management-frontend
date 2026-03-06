# ProTable 通用表格

基于 Ant Design Vue 4.x `a-table` 的封装，统一空状态、加载态、**固定高度表体滚动**、横向滚动与操作列插槽。默认表体高度 400px，在表格内滚动。

## Props

| 属性         | 类型                          | 默认        | 说明                                                                 |
| ------------ | ----------------------------- | ----------- | -------------------------------------------------------------------- |
| columns      | `ColumnsType<RecordType>`     | -           | 列配置，与 a-table 一致                                              |
| dataSource   | `RecordType[]`                | -           | 数据源                                                               |
| loading      | `boolean`                     | false       | 加载态                                                               |
| rowKey       | `string \| (record) => Key`   | -           | 行 key                                                               |
| pagination   | `false \| ProTablePagination` | false       | 分页：false 不分页；对象时为受控分页                                 |
| scroll       | `{ x?, y? }`                  | -           | 横向/纵向滚动（会与 scrollHeight 合并）                              |
| scrollHeight | `number \| string`            | 400         | 表体固定高度（数字为 px），表格在**内部滚动**；传 `0` 表示不固定高度 |
| actionsKey   | `string`                      | `'actions'` | 操作列 key，匹配时使用 `#actions` 插槽                               |
| emptyText    | `string`                      | -           | 空数据时文案                                                         |

### ProTablePagination

- `current`, `pageSize`, `total`: 受控分页
- `onChange?(page, pageSize)`: 页码/每页条数变化时回调

## Slots

- **bodyCell**：自定义单元格，参数 `{ column, record, index }`。未提供时默认渲染文本。
- **actions**：操作列内容，参数 `{ record, column, index }`。仅当列 `key === actionsKey` 时使用。

## Events

- **change**：`(pagination, filters, sorter)`，与 a-table 的 onChange 一致（分页变化时也会触发）。

## 使用示例

```vue
<template>
  <ProTable
    :columns="columns"
    :data-source="dataSource"
    :loading="loading"
    row-key="id"
    :scroll="{ x: 1100 }"
    :scroll-height="400"
    :pagination="paginationConfig"
    @change="onTableChange"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'status'">
        <a-badge :status="record.status === 'active' ? 'success' : 'default'" :text="..." />
      </template>
    </template>
    <template #actions="{ record }">
      <a-button type="link" size="small" @click="onEdit(record)">编辑</a-button>
    </template>
  </ProTable>
</template>
```

完整示例见：`/examples/pro-components` 路由对应页面。
