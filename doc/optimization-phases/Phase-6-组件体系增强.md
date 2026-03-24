# Phase 6: 组件体系增强

> **风险等级**：🟢 低 | **预估工作量**：3 天 | **前置依赖**：无（可独立实施）

## 概述

新增通用业务组件，增强现有 PageTable 的声明式配置能力。所有改动为**新增组件或扩展（非覆盖）现有接口**，现有页面**按需接入**，不影响未接入页面。

---

## 6.1 RightToolbar 组件

### 目标

列表页通用工具栏组件，提供搜索区展开/收起、刷新数据、列设置弹窗三个功能。

### 影响分析

| 文件 | 变更类型 | 影响范围 |
|------|---------|---------|
| `src/components/RightToolbar/index.vue` | 新增 | 独立组件 |

### 实施步骤

#### 新建 `src/components/RightToolbar/index.vue`

```vue
<template>
  <div class="right-toolbar">
    <slot />
    <a-tooltip title="搜索">
      <a-button
        v-if="showSearch !== undefined"
        type="text"
        @click="$emit('update:showSearch', !showSearch)"
      >
        <template #icon><SearchOutlined /></template>
      </a-button>
    </a-tooltip>
    <a-tooltip title="刷新">
      <a-button type="text" @click="$emit('refresh')">
        <template #icon><ReloadOutlined /></template>
      </a-button>
    </a-tooltip>
    <a-tooltip title="列设置">
      <a-popover trigger="click" placement="bottomRight">
        <a-button type="text">
          <template #icon><SettingOutlined /></template>
        </a-button>
        <template #content>
          <div class="column-setting">
            <a-checkbox-group
              :value="visibleColumns"
              @change="(val: string[]) => $emit('update:visibleColumns', val)"
            >
              <div v-for="col in columns" :key="col.prop" class="column-item">
                <a-checkbox :value="col.prop" :disabled="col.lock">
                  {{ col.label }}
                </a-checkbox>
              </div>
            </a-checkbox-group>
          </div>
        </template>
      </a-popover>
    </a-tooltip>
  </div>
</template>

<script setup lang="ts">
import { SearchOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons-vue'

interface ColumnInfo {
  prop?: string
  label?: string
  lock?: boolean
}

defineProps<{
  /** 搜索区域是否展开 */
  showSearch?: boolean
  /** 列配置列表 */
  columns?: ColumnInfo[]
  /** 当前可见列的 prop 列表 */
  visibleColumns?: string[]
}>()

defineEmits<{
  'update:showSearch': [value: boolean]
  'update:visibleColumns': [value: string[]]
  refresh: []
}>()
</script>

<style scoped>
.right-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
}

.column-setting {
  max-height: 300px;
  overflow-y: auto;
}

.column-item {
  padding: 4px 0;
}
</style>
```

### 使用示例

```vue
<template>
  <PageHead title="用户管理">
    <template #extra>
      <a-button type="primary" @click="handleAdd">新增</a-button>
      <RightToolbar
        v-model:showSearch="showSearch"
        :columns="tableColumns"
        v-model:visibleColumns="visibleCols"
        @refresh="fetchData"
      />
    </template>
  </PageHead>

  <PageFilter v-show="showSearch" ... />
  <PageTable ... />
</template>
```

---

## 6.2 PageTable 操作列权限增强

### 目标

为操作列按钮增加声明式权限过滤：通过 `permission` 字段，按钮仅在用户拥有对应角色时显示。

### 影响分析

| 文件 | 变更类型 | 影响范围 |
|------|---------|---------|
| `src/components/PageTable/types.ts` | 修改 | 新增可选字段，不破坏现有接口 |
| `src/components/PageTable/OperationCell.vue` | 修改 | 新增过滤逻辑 |

### 安全评估

- `permission` 字段为**可选**（`?`），不传时按钮照常显示 → 现有页面零影响
- 过滤逻辑使用现有 `usePermission().checkRoles()` → 不引入新依赖

### 实施步骤

#### Step 1: 修改 `src/components/PageTable/types.ts`

在 `PageTableOperationBtn` 接口中追加：

```diff
 export interface PageTableOperationBtn {
   /** 按钮文案 */
   text: string
+  /** 所需角色（可选），用户无对应角色时按钮不显示 */
+  permission?: import('@/types/auth').UserRole[]
   /** 动态文案 */
   dynamicText?: (row: Record<string, any>) => string
   // ... 后续字段不变 ...
 }
```

#### Step 2: 修改 `src/components/PageTable/OperationCell.vue`

在按钮渲染前增加权限过滤：

```diff
+import { usePermission } from '@/composables/usePermission'

+const { checkRoles } = usePermission()

 // 过滤可见按钮
 const visibleBtns = computed(() => {
   return props.btns.filter((btn) => {
+    // 权限过滤（新增）
+    if (btn.permission && btn.permission.length > 0) {
+      if (!checkRoles(btn.permission)) return false
+    }
     // 原有的 btnIsShow 过滤
     if (btn.btnIsShow) return btn.btnIsShow(props.row)
     return true
   })
 })
```

> 注：如果 OperationCell 当前没有 `visibleBtns` computed，需先找到其按钮渲染处，在 `v-for` 之前或 `v-if` 中加入 permission 检查。

### 使用示例

```typescript
const columns = [
  {
    type: 'operation',
    label: '操作',
    btns: [
      {
        text: '编辑',
        permission: ['sysadmin', 'org_admin'],  // 仅管理员可见
        handle: (row) => handleEdit(row),
      },
      {
        text: '删除',
        type: 'popconfirm',
        permission: ['sysadmin'],                // 仅超管可见
        popconfirmTitle: '确认删除？',
        handle: (row) => handleDelete(row),
      },
      {
        text: '查看',                             // 无 permission → 所有人可见
        handle: (row) => handleView(row),
      },
    ],
  },
]
```

---

## 6.3 字典标签组件（DictTag）

### 目标

统一展示字典/枚举值为可读标签，替代各页面中零散的 `v-if` / formatter 逻辑。

### 影响分析

| 文件 | 变更类型 | 影响范围 |
|------|---------|---------|
| `src/components/DictTag/index.vue` | 新增 | 独立组件 |
| `src/composables/useDict.ts` | 新增 | 独立 composable |

### 安全评估

- 纯新增，按需在页面中使用
- 不依赖后端字典接口（v1 版本使用本地枚举映射，后续可扩展为从后端加载）

### 实施步骤

#### Step 1: 新建 `src/composables/useDict.ts`

```typescript
/**
 * 字典数据管理
 * v1: 本地枚举映射；v2 可扩展为从后端 /dict/data 加载
 */

export interface DictOption {
  label: string
  value: string | number | boolean
  /** Ant Design 标签颜色 */
  color?: string
  /** 是否为默认值 */
  default?: boolean
}

export type DictMap = Record<string, DictOption[]>

/** 内置字典 */
const builtinDicts: DictMap = {
  // 用户状态
  user_status: [
    { label: '启用', value: true, color: 'green' },
    { label: '禁用', value: false, color: 'red' },
  ],
  // 用户角色
  user_role: [
    { label: '超级管理员', value: 'sysadmin', color: 'purple' },
    { label: '机构管理员', value: 'org_admin', color: 'blue' },
    { label: '科室管理员', value: 'dept_admin', color: 'cyan' },
    { label: '普通用户', value: 'user', color: 'default' },
  ],
}

/**
 * 获取字典选项列表
 */
export function useDict(...dictTypes: string[]) {
  const dicts = reactive<Record<string, DictOption[]>>({})

  dictTypes.forEach((type) => {
    if (builtinDicts[type]) {
      dicts[type] = builtinDicts[type]
    } else {
      dicts[type] = []
      // TODO: v2 从后端加载字典数据
      // loadDictFromApi(type).then(options => { dicts[type] = options })
    }
  })

  return dicts
}

/**
 * 根据字典值查找 label
 */
export function getDictLabel(options: DictOption[], value: any): string {
  const found = options.find((opt) => opt.value === value)
  return found?.label || String(value)
}

/**
 * 根据字典值查找 color
 */
export function getDictColor(options: DictOption[], value: any): string {
  const found = options.find((opt) => opt.value === value)
  return found?.color || 'default'
}
```

#### Step 2: 新建 `src/components/DictTag/index.vue`

```vue
<template>
  <a-tag v-if="option" :color="option.color || 'default'">
    {{ option.label }}
  </a-tag>
  <span v-else>{{ value }}</span>
</template>

<script setup lang="ts">
import type { DictOption } from '@/composables/useDict'

const props = defineProps<{
  /** 字典选项列表 */
  options: DictOption[]
  /** 当前值 */
  value: string | number | boolean
}>()

const option = computed(() => props.options.find((opt) => opt.value === props.value))
</script>
```

### 使用示例

```vue
<script setup lang="ts">
import { useDict } from '@/composables/useDict'

const { user_role, user_status } = useDict('user_role', 'user_status')
</script>

<template>
  <!-- 在表格列中使用 -->
  <DictTag :options="user_role" :value="record.role" />
  <DictTag :options="user_status" :value="record.is_active" />
</template>
```

在 PageTable columns 的 formatter 中使用：

```typescript
import { getDictLabel } from '@/composables/useDict'

const columns = [
  {
    label: '角色',
    prop: 'role',
    formatter: (row) => getDictLabel(userRoleOptions, row.role),
  },
]
```

---

## 完成标志

- [ ] RightToolbar 组件可正常使用（搜索切换、刷新、列设置）
- [ ] PageTable 操作按钮支持 `permission` 字段权限过滤
- [ ] 不传 `permission` 的按钮行为不变
- [ ] DictTag 组件正确显示字典标签和颜色
- [ ] useDict 返回的字典数据正确
- [ ] 现有页面未接入新组件时行为不变
- [ ] `pnpm dev` 无报错，TypeScript 编译通过
