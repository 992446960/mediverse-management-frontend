# Plan 15: 知识库搜索模块

> 来源阶段：Phase 5（任务 5.1~5.7）  
> 前置依赖：Plan 13（SSE 流式对话核心能力，复用 useSSEChat）、Plan 14（SessionSidebar 复用）、Plan 10（知识卡组件复用）  
> 项目目录：`mediverse-management-frontend/`

---

## 一、设计文档

| 文档 | 路径 | 参考章节 |
|------|------|---------|
| API 设计 | `doc/初始文档/API设计.md` | KnowledgeBase 域 → 知识库搜索接口（创建搜索会话/发送追问/获取结果） |
| 产品规划 | `doc/初始文档/产品规划.md` | 知识库搜索功能定义 |
| 原型交互 | `doc/初始文档/原型交互设计.md` | 搜索入口页布局、搜索结果页布局 |
| 前端架构与阶段规划 | `doc/前端开发文档/前端开发架构与阶段规划.md` | Phase 5 任务 5.1~5.7、四.4 Sidebar 复用 |
| 前端实施指南 | `doc/前端开发文档/前端开发实施指南.md` | 七、知识库搜索模块 |

### 关键设计要点

- 搜索接口使用 SSE 流式响应，复用 `useSSEChat` Composable
- 搜索会话侧边栏复用 **Ant Design X Vue** 的 `Conversations` 组件（同 Plan 14 的 SessionSidebar）
- 搜索结果的 AI 回答使用 `Bubble` 组件渲染，复用 Plan 14 的 BubbleRenderer 自定义渲染
- 搜索结果支持引用标注（`[1][2]` 转换为可点击上标链接）
- 追问输入框使用 `Sender` 组件
- 思考过程使用 `ThoughtChain` 组件
- 支持多轮追问，保留上下文
- 知识卡详情复用 `KnowledgeCardViewer`
- "我的知识卡"页面复用 Plan 10 的知识卡组件

---

## 二、参与的智能体与 Skills

| 角色 | 智能体/Skill | 职责 |
|------|-------------|------|
| 执行 | `frontend-developer` | 实现搜索 API/Store、入口页、结果页、搜索线程组件、知识卡页面 |
| 参考 | `ux-designer` | 搜索交互审查（可选） |
| 参考 | Skill: `vue-best-practices` | 组件复用 |
| 参考 | Skill: `pinia` | Store 设计 |

---

## 三、计划内容

### 3.1 任务清单

| 编号 | 任务 | 描述 | 涉及文件 |
|------|------|------|---------|
| 15-1 | 知识搜索 API 层 | createSearchSession/getSearchSessions/deleteSearchSession/sendFollowUp（SSE） | `src/api/knowledgeSearch.ts` |
| 15-2 | KnowledgeSearch Store | 搜索会话列表/当前活跃搜索会话/搜索历史管理 | `src/stores/knowledgeSearch.ts` |
| 15-3 | KBSidebar 组件 | 复用 `Conversations` 组件（sessionType='kb_search'），注入 useKnowledgeSearchStore | `src/components/KBSidebar/index.vue` |
| 15-4 | SearchResultThread 组件 | 多轮搜索结果线程：使用 `Bubble` 渲染 AI 回答（复用 BubbleRenderer + 引用标注 + `ThoughtChain` 思考过程 + 相关问题推荐） | `src/components/SearchResultThread/index.vue` |
| 15-5 | CitationLink 子组件 | 引用标注组件：`[1]` 转换为上标链接，hover 预览知识卡摘要，点击弹出详情 | `src/components/SearchResultThread/CitationLink.vue` |
| 15-6 | RelatedQuestions 子组件 | 相关问题推荐：Tag 形式展示，点击后作为追问发送 | `src/components/SearchResultThread/RelatedQuestions.vue` |
| 15-7 | 搜索入口页 | `/knowledge-base`：大搜索框+最近搜索历史标签+最新文件/知识卡推荐卡片 | `src/views/knowledge-base/index.vue`、`src/views/knowledge-base/layout.vue` |
| 15-8 | 搜索结果页 | `/knowledge-base/search/:id`：KBSidebar+SearchResultThread+底部追问输入框 | `src/views/knowledge-base/Search.vue` |
| 15-9 | 我的知识卡页面 | `/my/knowledge-cards`：复用 KnowledgeCardList+Editor+Viewer，ownerType='personal' | `src/views/my/KnowledgeCards.vue`（若 Plan 12 已创建则更新） |
| 15-10 | 搜索 Mock Handler | 模拟搜索 API + SSE 流式搜索结果 | `src/mocks/handlers/knowledgeSearch.ts` |

### 3.2 搜索入口页布局

```
┌─────────────────────────────────────────────┐
│           [🔍 搜索全部知识库...              ]  │
│                                             │
│   最近搜索: [标签1] [标签2] [标签3]           │
│                                             │
│   ┌──────────────────┐ ┌──────────────────┐ │
│   │ 📄 最新文件       │ │ 🃏 最新知识卡     │ │
│   │  file1.pdf       │ │  卡片标题1        │ │
│   │  file2.docx      │ │  卡片标题2        │ │
│   └──────────────────┘ └──────────────────┘ │
└─────────────────────────────────────────────┘
```

### 3.3 搜索结果页布局

```
┌──────────┬──────────────────────────────────┐
│ 搜索会话  │  [用户问题 1]                     │
│ 侧边栏   │  ──────────                       │
│          │  [AI 回答] (Markdown + 引用[1][2]) │
│ [新建搜索]│  [引用来源: 卡片A, 卡片B]         │
│          │  [相关问题: Q1, Q2, Q3]           │
│ 今日     │  ──────────                       │
│  session1│  [追问...]                        │
│ 昨天     │  ──────────                       │
│  session2│  [追问输入框                  🔍]  │
└──────────┴──────────────────────────────────┘
```

### 3.4 引用标注转换逻辑

```
AI 回答原文: "根据相关指南[1]，推荐的治疗方案包括[2]..."
  ↓ 渲染转换
HTML 输出: "根据相关指南<sup class="citation" data-index="1">[1]</sup>，推荐的治疗方案包括<sup class="citation" data-index="2">[2]</sup>..."
  ↓ 交互
hover → 弹出 Tooltip 展示知识卡摘要
click → 打开 KnowledgeCardViewer 详情
```

---

## 四、验收效果

- [ ] 搜索入口页大搜索框可输入，提交后创建搜索会话并跳转结果页
- [ ] 最近搜索历史标签展示，点击可重新搜索
- [ ] 搜索结果 Markdown 渲染正确
- [ ] 引用标注 `[1][2]` 转换为可点击上标，hover 预览，点击弹出详情
- [ ] 思考过程在搜索结果中正确展示
- [ ] 相关问题推荐以 Tag 展示，点击后发起追问
- [ ] 追问输入框可发送追问，SSE 流式接收响应
- [ ] 多轮追问上下文保留（同一搜索会话内）
- [ ] KBSidebar 会话列表按时间分组，支持新建/重命名/删除
- [ ] 我的知识卡页面正常渲染（复用知识卡组件，ownerType='personal'）
- [ ] SessionSidebar 在 Chat 和 KB 两种场景下复用正确
