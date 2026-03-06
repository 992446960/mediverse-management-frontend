# API Token 管理模块

## 路由与文件

**路由**: `/admin/api-tokens`  
**文件**: `frontend/app/admin/api-tokens/page.tsx`  
**权限**: 系统管理员

---

## 功能描述

管理 API 访问令牌，用于外部系统集成。

### 核心功能

1. 按机构查看和管理 Token
2. 生成新的 API Token
3. 编辑 Token 信息（名称、描述）
4. 启用/禁用 Token
5. 删除 Token
6. 查看 Token 使用情况

---

## 数据结构

```typescript
ApiToken {
  id: string,
  org_id?: string,          // 所属机构（可选，系统级Token无此字段）
  name: string,             // Token名称
  description?: string,     // 用途描述
  token_hash: string,       // Token哈希值（实际应用中不存储明文）
  status: 'active' | 'inactive',
  last_used_at?: string,    // 最后使用时间
  created_by: string,       // 创建者
  created_at: string,
  plainTextToken?: string   // 仅在创建时返回一次
}
```

---

## UI 布局

### 整体布局

```
┌─────────────────────────────────────────┐
│ 机构列表   │  Token 列表                │
│            │                            │
│ 机构1      │  标题: 机构1 - API Token  │
│ 机构2      │        [生成新Token] 按钮 │
│ 机构3      │                            │
│            │  ┌──────────────────────┐ │
│            │  │ 名称 │ Token │ 状态 │..││
│            │  ├──────────────────────┤ │
│            │  │ 计费 │ sk_***│ 有效 │..││
│            │  │ 研究 │ sk_***│ 禁用 │..││
│            │  └──────────────────────┘ │
└─────────────────────────────────────────┘
```

### 左侧边栏 - 机构列表

- 使用 `Card` + `ScrollArea`
- 显示所有机构
- 点击切换当前查看的机构
- 高亮当前选中的机构

### 右侧内容 - Token 列表

- 使用 `Table` 组件
- 显示当前机构的所有 Token

---

## 表格列详解

| 列名         | 宽度   | 说明                    | 组件                       |
| ------------ | ------ | ----------------------- | -------------------------- |
| 名称         | 150px  | Token 名称 + 描述       | Text (2 行)                |
| Token        | 300px  | Token 值（可显示/隐藏） | Code + 眼睛图标 + 复制按钮 |
| 状态         | 自动   | 有效/已禁用             | Badge                      |
| 最后使用时间 | 自动   | 时间戳                  | Text                       |
| 创建时间     | 自动   | 日期                    | Text                       |
| 操作         | 右对齐 | 启用/禁用、编辑、删除   | Button Group               |

---

## 交互流程

### 1. 生成新 Token

**步骤**:

1. 点击 [生成新 Token] 按钮
2. 打开对话框，填写信息：
   - 所属机构（下拉选择，默认当前机构）
   - 名称（必填）
   - 描述（可选）
3. 点击 [生成] 按钮
4. 显示新生成的 Token（仅此一次）
5. 用户复制 Token
6. 关闭对话框，刷新列表

**对话框组件**:

```typescript
<Dialog>
  <DialogHeader>
    <DialogTitle>生成新 Token</DialogTitle>
    <DialogDescription>为当前机构创建一个新的 API 访问令牌。</DialogDescription>
  </DialogHeader>
  <Form>
    <Select label='所属机构' />
    <Input label='名称' placeholder='例如：外部计费系统' />
    <Textarea label='描述' placeholder='用途说明...' />
  </Form>
  <DialogFooter>
    <Button>生成</Button>
  </DialogFooter>
</Dialog>
```

### 2. 显示新生成的 Token

**特殊对话框**:

```typescript
<Dialog>
  <DialogHeader>
    <DialogTitle>Token 已生成</DialogTitle>
    <DialogDescription>
      请立即复制并保存此 Token。出于安全原因，它将不会再次显示。
    </DialogDescription>
  </DialogHeader>
  <div className='flex items-center space-x-2'>
    <Input value={newlyCreatedToken} readOnly className='font-mono bg-muted' />
    <Button size='sm' onClick={copyToken}>
      {copied ? <Check /> : <Copy />}
    </Button>
  </div>
  <DialogFooter>
    <Button>完成</Button>
  </DialogFooter>
</Dialog>
```

### 3. Token 显示/隐藏

**默认状态**: 隐藏（显示为 `sk-****************abcd`）  
**点击眼睛图标**: 切换显示/隐藏  
**点击复制图标**: 复制完整 Token

**实现**:

```typescript
const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set())

const toggleVisibility = (id: string) => {
  const newVisible = new Set(visibleTokens)
  if (newVisible.has(id)) {
    newVisible.delete(id)
  } else {
    newVisible.add(id)
  }
  setVisibleTokens(newVisible)
}
```

### 4. 编辑 Token 信息

**可编辑字段**:

- 名称
- 描述

**不可编辑**:

- Token 值（安全考虑）
- 所属机构（创建后不可更改）

### 5. 启用/禁用 Token

**操作**: 点击 [启用]/[禁用] 按钮  
**效果**: 切换 Token 状态，禁用后无法使用

### 6. 删除 Token

**操作**: 点击删除按钮  
**确认**: 弹出 AlertDialog 确认  
**效果**: 永久删除 Token 记录

---

## 使用的 UI 组件

### 基础组件

- `Card` - 左侧边栏容器
- `Table` - Token 列表
- `Dialog` - 创建/编辑对话框
- `AlertDialog` - 删除确认
- `Button` - 各种操作按钮
- `Input` - 表单输入
- `Textarea` - 描述输入
- `Select` - 机构选择
- `Badge` - 状态标签
- `ScrollArea` - 滚动区域

### 图标

- `Building2` - 机构图标
- `Key` - Token 图标
- `Eye` / `EyeOff` - 显示/隐藏
- `Copy` - 复制
- `Check` - 已复制
- `Pencil` - 编辑
- `Trash2` - 删除
- `Plus` - 新增

---

## 状态管理

使用本地状态（useState）:

```typescript
const [tokens, setTokens] = useState<ApiToken[]>([])
const [organizations, setOrganizations] = useState<Organization[]>([])
const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
const [isDialogOpen, setIsDialogOpen] = useState(false)
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
const [isTokenDisplayOpen, setIsTokenDisplayOpen] = useState(false)
const [currentToken, setCurrentToken] = useState<ApiToken | null>(null)
const [newlyCreatedToken, setNewlyCreatedToken] = useState<string>('')
const [copied, setCopied] = useState(false)
const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set())
```

---

## API 调用

```typescript
// 获取所有 Token
const tokens = await api.getApiTokens()

// 创建新 Token
const result = await api.createApiToken({
  name: 'External Billing System',
  description: 'Integration with billing API',
  org_id: 'org-1'
})
// result.plainTextToken 仅在创建时返回

// 更新 Token 信息
await api.updateApiToken(tokenId, {
  name: 'New Name',
  description: 'New Description'
})

// 删除 Token
await api.deleteApiToken(tokenId)
```
