# Plan 14: 数字医生体验完整页面

> 来源阶段：Phase 4（任务 4.3~4.14）  
> 前置依赖：Plan 13（SSE 流式对话核心能力）、Plan 12（三级工作台页面 - 对话测试占位）  
> 项目目录：`mediverse-management-frontend/`

---

## 一、设计文档

| 文档 | 路径 | 参考章节 |
|------|------|---------|
| 产品规划 | `doc/初始文档/产品规划.md` | 数字医生体验模块功能定义 |
| API 设计 | `doc/初始文档/API设计.md` | Ecosys 域 → 分身列表（选择器）、评分接口 |
| 原型交互 | `doc/初始文档/原型交互设计.md` | 对话页面三栏布局、消息气泡、输入区域、思考过程、评分弹窗 |
| 前端架构与阶段规划 | `doc/前端开发文档/前端开发架构与阶段规划.md` | Phase 4 任务 4.3~4.14、四.3 对话组件复用架构 |
| 前端实施指南 | `doc/前端开发文档/前端开发实施指南.md` | 六.4 ChatWindow Props、六.5 MessageInput 功能配置 |

### 关键设计要点

- 使用 **Ant Design X Vue** 核心组件替代手写对话 UI：
  - `Bubble` / `BubbleList`：替代手写 MessageBubble + MessageList，内置流式打字机效果、角色区分、Markdown 渲染
  - `Sender`：替代手写 MessageInput，内置多行/发送/附件能力
  - `ThoughtChain`：替代手写 ThinkingProcess，专为 AI 思考链设计
  - `Conversations`：替代手写 SessionSidebar，内置分组/搜索/右键菜单
  - `Prompts`：可用于初始引导/推荐问题
  - `Attachments`：可用于附件上传/预览
- ChatWindow 仍为核心复用组件，通过 Props 控制四处复用模式
- 引用来源使用自定义 SourceCitation 组件（Ant Design X Vue 无对应组件，需手写）
- 评分弹窗使用 Ant Design Vue 的 Modal + Rate 组件
- 分身选择器按机构→科室筛选
- 补全三个工作台的对话测试页

---

## 二、参与的智能体与 Skills

| 角色 | 智能体/Skill | 职责 |
|------|-------------|------|
| 执行 | `frontend-developer` | 实现全部对话 UI 组件、评分弹窗、对话测试页 |
| 参考 | `ux-designer` | 对话交互细节审查（消息气泡样式、动画等） |
| 参考 | Skill: `vue-best-practices` | 组件设计 |
| 参考 | Skill: `vue-router-best-practices` | 路由参数传递 |

---

## 三、计划内容

### 3.1 任务清单

| 编号 | 任务 | 描述 | 涉及文件 |
|------|------|------|---------|
| **消息展示（Ant Design X Vue）** | | | |
| 14-1 | BubbleList 集成 | 使用 `BubbleList` 组件渲染消息列表，配置 `roles`（user/assistant 角色样式）、`items`（消息数组），内置自动滚动和流式打字机效果 | `src/components/ChatWindow/MessageList.vue` |
| 14-2 | Bubble 自定义渲染 | 自定义 Bubble 的 `messageRender` slot：Markdown 渲染（marked + dompurify）+ 代码高亮（highlight.js）+ 复制按钮 | `src/components/ChatWindow/BubbleRenderer.vue` |
| 14-3 | ThoughtChain 集成 | 使用 `ThoughtChain` 组件替代手写 Timeline，映射 thinkingSteps 数据到 items，支持 status（pending/success/error）和可折叠 | `src/components/ChatWindow/ThinkingProcess.vue` |
| 14-4 | SourceCitation 组件 | 引用来源（自定义）：助手消息底部展示引用的知识卡/文件列表，点击弹出详情 | `src/components/ChatWindow/SourceCitation.vue` |
| **消息输入（Ant Design X Vue）** | | | |
| 14-5 | Sender 集成 | 使用 `Sender` 组件替代手写输入框：配置 `allowSpeech`、附件上传（`Attachments` 组件）、自定义 header（思考模式/联网搜索 toolbar）、流式期间切换为「停止」按钮 | `src/components/ChatWindow/MessageInput.vue` |
| **主对话窗口** | | | |
| 14-6 | ChatWindow 组件 | 整合 BubbleList + Sender + ThoughtChain + SourceCitation + Prompts（初始引导问题） | `src/components/ChatWindow/index.vue` |
| **会话管理（Ant Design X Vue）** | | | |
| 14-7 | Conversations 集成 | 使用 `Conversations` 组件替代手写 SessionSidebar：配置 `items`（会话列表）、`groupable`（按时间分组）、`menu`（右键菜单：重命名/删除）。Chat 和 KB 搜索共用 | `src/components/SessionSidebar/index.vue` |
| 14-8 | ChatSidebar 封装 | 聊天场景：注入 useChatStore，映射 groupedSessions → Conversations items | `src/components/ChatSidebar/index.vue` |
| **分身选择** | | | |
| 14-9 | AvatarSelector 组件 | 新建会话时的分身选择面板：按机构→科室筛选，分身卡片（头像/名称/类型/简介），点击创建会话 | `src/components/AvatarSelector/index.vue` |
| **评分反馈** | | | |
| 14-10 | RatingDialog 组件 | 评分弹窗：多维度星级（诊断准确率/问诊完成度）+文本反馈（可选） | `src/components/RatingDialog/index.vue` |
| **页面集成** | | | |
| 14-11 | 数字医生首页 | `/chat` 路由：ChatSidebar + 主区域（无会话→AvatarSelector，有会话→ChatWindow） | `src/views/chat/index.vue`、`src/views/chat/layout.vue` |
| 14-12 | 会话详情页 | `/chat/session/:id` 路由：加载指定会话消息历史+继续对话 | `src/views/chat/Session.vue` |
| **对话测试** | | | |
| 14-13 | AvatarTestPage 通用组件 | 简化版 ChatWindow（不含侧边栏和技能区），isTestMode=true | `src/components/AvatarTestPage/index.vue` |
| 14-14 | 补全三个工作台对话测试 | 替换 Plan 12 的占位页面，接入 AvatarTestPage | `src/views/my/AvatarTest.vue`、`src/views/dept/AvatarTest.vue`、`src/views/org/AvatarTest.vue` |

### 3.2 ChatWindow 四处复用配置

| 场景 | showSidebar | showSkillPanel | isTestMode | avatarId |
|------|-------------|----------------|------------|----------|
| `/chat/session/:id` | true | true | false | — |
| `/my/avatar/test` | false | false | true | 当前用户分身 ID |
| `/dept/avatar/test` | false | false | true | 科室分身 ID |
| `/org/avatar/test` | false | false | true | 机构分身 ID |

### 3.3 MessageInput 功能区配置

```typescript
const inputFeatures = [
  { key: 'thinkingMode', type: 'select', options: ['high', 'medium', 'low'], default: 'medium' },
  { key: 'webSearch', type: 'switch', default: false },
  { key: 'attachment', type: 'upload', accept: '.jpg,.png,.webp,.pdf,.docx', maxSize: 20 },
]
```

### 3.4 评分维度配置

```typescript
const ratingDimensions = [
  { key: 'diagnosticAccuracy', label: t('rating.diagnosticAccuracy'), max: 5 },
  { key: 'consultationCompleteness', label: t('rating.consultationCompleteness'), max: 5 },
]
```

---

## 四、验收效果

- [ ] 消息列表用户/助手消息气泡样式区分正确
- [ ] 助手消息 Markdown 渲染正确，代码块有语法高亮
- [ ] 流式响应逐字渲染效果流畅（打字机效果）
- [ ] 自动滚动到最新消息
- [ ] 思考过程 Timeline 可折叠/展开，进行中步骤有 loading 动画
- [ ] 引用来源列表可点击查看详情
- [ ] Enter 发送消息、Shift+Enter 换行
- [ ] 流式期间发送按钮禁用、显示"停止生成"按钮
- [ ] 中止生成后立即停止输出
- [ ] ChatSidebar 会话列表按时间分组正确
- [ ] 新建会话 → AvatarSelector → 选择分身 → 创建会话成功
- [ ] 评分弹窗多维度星级评分可提交
- [ ] `/chat/session/:id` URL 直接访问可加载对应会话
- [ ] 三个工作台对话测试页均可正常发起对话（isTestMode=true）
