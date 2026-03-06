# Plan 10: 知识卡通用组件集

> 来源阶段：Phase 3（任务 3.7、3.8、3.9）  
> 前置依赖：Plan 09（文件管理通用组件集，复用知识库 API）  
> 项目目录：`mediverse-management-frontend/`

---

## 一、设计文档

| 文档 | 路径 | 参考章节 |
|------|------|---------|
| API 设计 | `doc/初始文档/API设计.md` | KnowledgeBase 域 → 知识卡 CRUD + 版本管理 + 上下线 |
| 原型交互 | `doc/初始文档/原型交互设计.md` | 知识卡列表（Tab 分类）、编辑器、详情查看器（版本 Timeline） |
| 产品规划 | `doc/初始文档/产品规划.md` | 三类知识卡定义、审核流程 |
| 前端架构与阶段规划 | `doc/前端开发文档/前端开发架构与阶段规划.md` | Phase 3 任务 3.7~3.9 |
| 前端实施指南 | `doc/前端开发文档/前端开发实施指南.md` | 五.4 知识卡类型定义 |

### 关键设计要点

- 本计划需安装 Tiptap（富文本编辑）、marked（Markdown 渲染）、dompurify（XSS 防护）
- KnowledgeCardList：Tab 分类展示三类知识卡，支持搜索/过滤
- KnowledgeCardEditor：Tiptap 富文本编辑 Markdown 内容
- KnowledgeCardViewer：Drawer 查看详情 + 版本 Timeline + 溯源文件
- 三个组件通过 workspace context 获取 ownerType/ownerId

---

## 二、参与的智能体与 Skills

| 角色 | 智能体/Skill | 职责 |
|------|-------------|------|
| 执行 | `frontend-developer` | 实现三个知识卡组件、安装新依赖、完善 Mock |
| 参考 | Skill: `vue-best-practices` | 组件设计规范 |
| 参考 | Skill: `vue` | Slot、Teleport、Transition |

---

## 三、计划内容

### 3.1 任务清单

| 编号 | 任务 | 描述 | 涉及文件 |
|------|------|------|---------|
| 10-1 | 安装依赖 | `pnpm add @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-placeholder marked dompurify` + `pnpm add -D @types/dompurify` | `package.json` |
| 10-2 | KnowledgeCardList 组件 | Tab 分类展示（全部/循证卡/规则卡/经验卡），表格列配置化（标题/类型Tag/状态Badge/引用次数/更新时间/操作），支持搜索和过滤 | `src/components/KnowledgeCardList/index.vue` |
| 10-3 | KnowledgeCardEditor 组件 | Modal/Drawer 编辑器：标题输入、类型选择、Tiptap Markdown 编辑区、标签输入（可添加/移除）、保存时生成新版本 | `src/components/KnowledgeCardEditor/index.vue` |
| 10-4 | TiptapEditor 子组件 | 封装 Tiptap 编辑器：菜单栏（加粗/斜体/标题/列表/代码块/引用）、Markdown 输入/输出、placeholder 支持 | `src/components/KnowledgeCardEditor/TiptapEditor.vue` |
| 10-5 | KnowledgeCardViewer 组件 | Drawer 查看器：内容渲染（marked + dompurify）、类型标签、标签展示、溯源文件列表、版本 Timeline | `src/components/KnowledgeCardViewer/index.vue` |
| 10-6 | VersionTimeline 子组件 | 版本历史 Timeline：版本号/变更摘要/操作人/时间，每个版本有"预览"和"回退"按钮，回退需二次确认 | `src/components/KnowledgeCardViewer/VersionTimeline.vue` |
| 10-7 | 知识卡 Mock 补充 | 在 knowledge Mock handler 中补充知识卡 CRUD + 版本查询 + 上下线 + 回退接口 | `src/mocks/handlers/knowledge.ts`（补充） |
| 10-8 | 知识卡 Mock 数据 | 三类知识卡数据 + 版本历史数据 | `src/mocks/data/knowledgeCards.ts` |

### 3.2 知识卡类型 Tag 颜色

| 类型 | Tag 颜色 | 标签文案 |
|------|---------|---------|
| evidence | blue | 循证卡 |
| rule | orange | 规则卡 |
| experience | green | 经验卡 |

### 3.3 知识卡状态 Badge

| 字段 | 值 | 颜色 |
|------|-----|------|
| online_status | online | green |
| online_status | offline | default |
| audit_status | pending | orange |
| audit_status | approved | green |
| audit_status | rejected | red |

### 3.4 Tiptap 编辑器功能配置

```typescript
const extensions = [
  StarterKit,
  Placeholder.configure({ placeholder: t('card.editor.placeholder') }),
]

const menuItems = [
  { key: 'bold', icon: 'BoldOutlined', action: 'toggleBold' },
  { key: 'italic', icon: 'ItalicOutlined', action: 'toggleItalic' },
  { key: 'heading', icon: 'FontSizeOutlined', action: 'toggleHeading', attrs: { level: 2 } },
  { key: 'bulletList', icon: 'UnorderedListOutlined', action: 'toggleBulletList' },
  { key: 'orderedList', icon: 'OrderedListOutlined', action: 'toggleOrderedList' },
  { key: 'codeBlock', icon: 'CodeOutlined', action: 'toggleCodeBlock' },
  { key: 'blockquote', icon: 'LineOutlined', action: 'toggleBlockquote' },
]
```

---

## 四、验收效果

- [ ] KnowledgeCardList Tab 切换正确过滤三类知识卡
- [ ] 搜索关键词过滤和状态过滤功能正常
- [ ] 表格列配置化渲染，类型列使用不同颜色 Tag
- [ ] 知识卡上线/下线操作成功，状态 Badge 更新
- [ ] KnowledgeCardEditor Tiptap 编辑器可正常输入 Markdown
- [ ] 编辑器菜单栏（加粗/斜体/标题等）功能正常
- [ ] 标签输入支持添加/移除
- [ ] 保存时调用 API 创建新版本
- [ ] KnowledgeCardViewer Markdown 内容渲染正确（使用 marked + dompurify）
- [ ] 溯源文件列表展示，点击可跳转文件预览
- [ ] 版本 Timeline 展示版本历史
- [ ] 版本回退有二次确认弹窗
