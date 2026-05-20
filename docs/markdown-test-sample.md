# Markdown 测试文本

这是一份用于预览、解析和样式检查的 Markdown 测试文本，覆盖常见排版元素。

## 基础段落

普通段落可以包含 **加粗文本**、*斜体文本*、`行内代码` 和 [示例链接](https://example.com)。

换行后的第二段用于检查段落间距、中文排版和英文混排效果。This sentence is used to test mixed Chinese and English rendering.

## 列表

### 无序列表

- 第一项：检查普通列表样式
- 第二项：包含 `inline code`
- 第三项：包含加粗内容 **important**

### 有序列表

1. 准备测试数据
2. 渲染 Markdown 内容
3. 检查页面样式和交互

## 引用

> 这是一段引用文本，用于检查引用块的缩进、边框和文字颜色。

## 表格

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| title | string | 标题文本 |
| content | markdown | Markdown 正文 |
| status | enum | draft / published |

## 代码块

```ts
interface MarkdownCard {
  title: string
  content: string
  tags: string[]
}

const sample: MarkdownCard = {
  title: 'Markdown 测试文本',
  content: '用于检查渲染效果',
  tags: ['markdown', 'test'],
}
```

## 任务列表

- [x] 支持标题
- [x] 支持表格
- [x] 支持代码块
- [ ] 支持更多扩展语法

## 分隔线

---

结束段落：如果你能看到这里，说明长文档滚动和基础 Markdown 渲染链路正常。
