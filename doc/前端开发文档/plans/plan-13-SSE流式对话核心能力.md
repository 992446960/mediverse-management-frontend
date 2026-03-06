# Plan 13: SSE 流式对话核心能力

> 来源阶段：Phase 4（任务 4.1、4.2）  
> 前置依赖：Plan 04（主布局与权限体系）  
> 项目目录：`mediverse-management-frontend/`

---

## 一、设计文档

| 文档 | 路径 | 参考章节 |
|------|------|---------|
| 技术设计 | `doc/初始文档/技术设计.md` | 四.1 SSE 协议设计（事件类型：delta/thinking_step/done/error） |
| API 设计 | `doc/初始文档/API设计.md` | Ecosys 域 → 对话消息发送（SSE）、会话 CRUD、消息列表 |
| 前端架构与阶段规划 | `doc/前端开发文档/前端开发架构与阶段规划.md` | ADR-002: fetch + ReadableStream |
| 前端实施指南 | `doc/前端开发文档/前端开发实施指南.md` | 六.1 SSE 流式对话 Composable、六.2 Chat Store、六.3 对话类型定义 |

### 关键设计要点

- **关键 ADR**：使用原生 `fetch` + `ReadableStream` 而非 `EventSource`，因需 POST + JWT
- SSE 四种事件类型：`thinking_step`（思考步骤）、`delta`（文本增量）、`done`（完成）、`error`（错误）
- 支持 `AbortController` 中止生成
- Chat Store 管理会话列表（按时间分组：今日/昨天/过去7天/更早）
- 本计划需安装 `highlight.js`（代码高亮）
- 渲染层将使用 **Ant Design X Vue**（ant-design-x-vue）的 `Bubble`/`BubbleList` 组件，其内置流式打字机效果，无需手写 DOM 更新逻辑
- `useSSEChat` 作为数据层 Composable，负责 SSE 解析；Ant Design X Vue 组件作为渲染层，消费 Composable 的响应式数据

---

## 二、参与的智能体与 Skills

| 角色 | 智能体/Skill | 职责 |
|------|-------------|------|
| 执行 | `frontend-developer` | 实现 useSSEChat Composable、Chat Store、会话 API、SSE Mock |
| 参考 | Skill: `vue-best-practices` | Composable 设计 |
| 参考 | Skill: `pinia` | Store 定义 |

---

## 三、计划内容

### 3.1 任务清单

| 编号 | 任务 | 描述 | 涉及文件 |
|------|------|------|---------|
| 13-1 | 安装依赖 | `pnpm add highlight.js`（ant-design-x-vue 已在 Plan 01 安装，其 BubbleList 内置虚拟滚动能力，无需 @tanstack/vue-virtual） | `package.json` |
| 13-2 | useSSEChat Composable | 核心 SSE 流式对话：fetch+ReadableStream 接收事件、逐行解析 SSE、处理四种事件、AbortController 中止 | `src/composables/useSSEChat.ts` |
| 13-3 | 会话 API 层 | getChatSessions/createChatSession/deleteChatSession/renameSession/getMessages/rateMessage | `src/api/sessions.ts` |
| 13-4 | Chat Store | useChatStore：sessions/currentSessionId/messages + groupedSessions(按时间分组) + CRUD actions + 流式消息更新 | `src/stores/chat.ts` |
| 13-5 | SSE Mock Handler | 模拟 SSE 流式响应：依次发送 thinking_step → 多个 delta → done 事件 | `src/mocks/handlers/sessions.ts` |
| 13-6 | 会话 Mock 数据 | 多个会话 + 消息历史（含文本/图片/附件类型） | `src/mocks/data/sessions.ts` |

### 3.2 useSSEChat 接口设计

```typescript
function useSSEChat(): {
  streaming: Ref<boolean>             // 是否正在流式输出
  currentText: Ref<string>            // 当前累积的文本
  thinkingSteps: Ref<ThinkingStep[]>  // 思考步骤列表
  error: Ref<string | null>           // 错误信息

  sendMessage: (
    url: string,
    body: FormData | Record<string, unknown>,
    options?: {
      onDelta?: (text: string) => void
      onDone?: (messageId: string) => void
    }
  ) => Promise<void>

  stopGeneration: () => void          // 中止生成
}
```

### 3.3 SSE 事件解析流程

```
fetch(url, { method: 'POST', headers: { Authorization, Content-Type }, body, signal })
  → response.body.getReader()
  → while (!done) { reader.read() }
    → decoder.decode(chunk)
    → 按 '\n' 分割
    → 过滤 'data: ' 前缀行
    → JSON.parse → handleSSEEvent(event)
      → thinking_step: 更新 thinkingSteps[index]
      → delta: currentText += event.content
      → done: 调用 onDone 回调
      → error: 设置 error 状态
```

### 3.4 Chat Store 会话分组

```typescript
groupedSessions: {
  today: Session[]      // 今日更新的会话
  yesterday: Session[]  // 昨日更新的会话
  week: Session[]       // 过去7天
  earlier: Session[]    // 更早
}
```

### 3.5 SSE Mock 实现要点

```typescript
// MSW 中模拟 SSE 流式响应
http.post('/api/v1/sessions/:id/messages', async ({ params }) => {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // 模拟思考步骤
      controller.enqueue(encoder.encode('data: {"type":"thinking_step","index":0,...}\n\n'))
      await delay(500)
      // 模拟文本增量
      for (const char of '这是模拟的回复内容...') {
        controller.enqueue(encoder.encode(`data: {"type":"delta","content":"${char}"}\n\n`))
        await delay(50)
      }
      // 完成
      controller.enqueue(encoder.encode('data: {"type":"done","message_id":"..."}\n\n'))
      controller.close()
    }
  })
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
})
```

---

## 四、验收效果

- [ ] `useSSEChat` 可成功连接 SSE 端点，逐字接收文本增量
- [ ] 思考步骤（thinking_step）实时更新到 `thinkingSteps` 数组
- [ ] `stopGeneration()` 调用后立即停止流式接收
- [ ] 中止生成不报 AbortError（已内部处理）
- [ ] HTTP 错误或解析失败时 `error` 状态正确设置
- [ ] Chat Store 会话按四组时间分组正确
- [ ] 创建会话后自动成为 currentSession
- [ ] 切换会话时消息列表正确加载
- [ ] `streaming` 状态在流式期间为 true，完成后为 false
- [ ] SSE Mock 可模拟完整的思考→输出→完成流程
