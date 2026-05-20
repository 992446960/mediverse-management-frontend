# 知识卡 Markdown + JSON 双栏展示设计

## 概述

将知识卡详情页的正文区域改为左右双栏展示（JSON + Markdown），同时将编辑器从 Tiptap（HTML 输出）替换为 md-editor-v3（Markdown 输出），使前端数据格式与 API 设计对齐。

## 背景

- 当前知识卡使用单一 `content` 字段存储内容，TiptapEditor 输出 HTML
- API 设计文档（4.1.8-4.1.10）明确定义了 `json_content` 和 `md_content` 两个独立字段
- 需求文档要求详情页双栏展示、编辑只允许修改 Markdown、JSON 只读

## API 字段映射

| 接口 | 字段 | 说明 |
| --- | --- | --- |
| 详情 (4.1.8) | `json_content` + `md_content` | 两个独立字段，前端分栏展示 |
| 创建 (4.1.9) | `json_content`(非必填) + `md_content`(必填) | 创建时 json_content 传空串 |
| 编辑 (4.1.10) | `md_content` | 只提交 Markdown，不提交 JSON |
| 版本对比 (4.1.13) | `diff[]` | 后端返回 diff 结果，前端只渲染，不涉及双字段 |

## 数据层改造

### 类型定义 (`src/types/knowledge.ts`)

`KnowledgeCard` 接口新增字段：

```typescript
export interface KnowledgeCard {
  // ...existing fields...
  content: string        // 保留，向后兼容旧数据和版本对比
  json_content: string   // 新增：结构化 JSON 字符串
  md_content: string     // 新增：Markdown 正文
}
```

`KnowledgeCardPayload` 调整：

```typescript
export interface KnowledgeCardPayload {
  id?: string
  title: string
  json_content?: string  // 创建时可选，编辑时不传
  md_content: string     // 替代原 content
  type: CardType
  tags: string[]
  source_file_ids?: string[]
}
```

### API 归一化 (`src/api/knowledge.ts`)

`normalizeKnowledgeCard()` 增加兼容逻辑：

- 后端返回 `json_content` / `md_content` 时直接使用
- 仅有 `content`（旧数据）时：`md_content = content`，`json_content = ""`
- `content` 保持赋值（取 `md_content` 或原 `content`），兼容版本对比等现有引用

### API 调用调整

- `saveKnowledgeCard()`：payload 中 `json_content` 传空串 `""`，`md_content` 传 Markdown 内容
- `updateKnowledgeCard()`：payload 中只发 `md_content`（不发 `json_content`），字段名从 `content` 改为 `md_content`

## UI 层改造

### 详情页双栏展示 (`KnowledgeCardViewer/index.vue`)

content tab 内的正文区域改为左右双栏：

```
┌─────────────────────────────────────────────┐
│  知识卡标题    [编辑] [上线/下线] [删除]      │
├─────────────────────┬───────────────────────┤
│  JSON 展示 (只读)    │  Markdown 渲染         │
│  vue-json-pretty    │  marked + DOMPurify   │
│                     │                       │
│  - 格式化展示        │  - 渲染后的 HTML        │
│  - 支持折叠/展开     │  - 保持现有样式         │
│  - 支持复制          │                       │
│  - 空 JSON 显示 {}   │                       │
├─────────────────────┴───────────────────────┤
│  标签: #xxx #yyy                             │
│  关联文件列表                                 │
└─────────────────────────────────────────────┘
```

- 左右各占 50%，使用 CSS grid `grid-cols-2`
- 左栏标题 "JSON"，右栏标题 "Markdown"
- `json_content` 为空或无效 JSON 时，左栏显示 `{}`
- 只读预览模式（readonlyPreview）同样适用双栏

### 新增 JSON 展示组件

创建 `src/components/KnowledgeCardViewer/JsonContentPane.vue`：

- 接收 `jsonContent: string` prop
- 尝试 `JSON.parse`，解析成功用 `vue-json-pretty` 渲染
- 解析失败显示空对象 `{}`
- 支持折叠、复制等基础阅读能力

### 编辑器替换

**移除 TiptapEditor，替换为 md-editor-v3：**

- 删除 `src/components/KnowledgeCardEditor/TiptapEditor.vue`
- 新建 `src/components/KnowledgeCardEditor/MarkdownEditor.vue`
- 使用 `md-editor-v3` 的 `MdEditor` 组件
- 接口保持 `v-model` 双向绑定，输入/输出均为 Markdown 文本
- 支持工具栏（加粗、斜体、标题、列表、代码块、引用等）

**KnowledgeCardEditor/index.vue 调整：**

- 引用从 `TiptapEditor` 改为 `MarkdownEditor`
- `formState.content` 改为 `formState.md_content`
- 创建时提交 `{ ..., json_content: "", md_content: formState.md_content }`
- 编辑时提交 `{ ..., md_content: formState.md_content }`

## 依赖变更

| 操作 | 包名 | 用途 |
| --- | --- | --- |
| 新增 | `vue-json-pretty` | JSON 只读展示 |
| 新增 | `md-editor-v3` | Markdown 编辑器 |
| 移除 | `@tiptap/vue-3` | 不再使用 |
| 移除 | `@tiptap/starter-kit` | 不再使用 |
| 移除 | `@tiptap/extension-placeholder` | 不再使用 |

## Mock 数据同步

`src/mocks/data/knowledgeCards.ts`：

- 每条 mock 知识卡新增 `json_content` 和 `md_content` 字段
- `md_content` 取原 `content` 值
- `json_content` 填充示例 JSON 结构

`src/mocks/handlers/knowledge.ts`：

- 创建/编辑接口的请求体字段名同步调整

## 国际化 (i18n)

`src/i18n/locales/zh-CN.ts` 和 `en-US.ts` 新增：

- `knowledge.card.jsonPane` / `knowledge.card.markdownPane`：双栏标题
- `knowledge.card.copyJson`：复制 JSON 按钮文案
- `knowledge.card.jsonEmpty`：JSON 为空时的提示

## 不改动的部分

- 版本对比 (VersionDiffView)：后端返回 diff 结果，前端只渲染
- 版本时间线 (VersionTimeline)：不涉及内容展示
- 知识库搜索/预览页面
- 关联文件列表 (AssociatedFilesList)
- 知识卡列表页面

## 验收标准

1. 打开知识卡详情时，content tab 显示 JSON + Markdown 左右双栏
2. JSON 栏只读，支持折叠/展开/复制
3. Markdown 栏正常渲染
4. JSON 为空时左栏显示 `{}`
5. 编辑知识卡时使用 Markdown 编辑器，直接编写 Markdown
6. 保存时发送 `md_content`（Markdown 格式），不发送 HTML
7. 创建知识卡时 `json_content` 传空字符串
8. 编辑知识卡时不提交 `json_content`
9. 旧数据（仅有 `content`）能正常兼容展示
