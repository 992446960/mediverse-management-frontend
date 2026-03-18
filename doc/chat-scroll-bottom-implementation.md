# 聊天保持滚动到底部实现文档

## 目标

- 接收消息（尤其是后端流式输出）时自动滚到底部
- 避免频繁 DOM 操作导致卡顿
- 在关键时刻（完成、切换会话）保证立即定位底部
- 用户上滑查看历史时暂停自动滚动，提供「回到底部」按钮

参考：`mediverse-admin-frontend-vite/doc/chat-scroll-bottom-implementation.md`

---

## 1. 实现方案（ant-design-x-vue BubbleList）

### 1.1 借助 BubbleList 能力

- **ref + nativeElement**：BubbleList 通过 `expose` 暴露 `nativeElement`，即其内部滚动容器的 DOM 引用
- **onScroll**：BubbleList 支持 `onScroll` 回调，在用户滚动时触发，用于判断是否在底部

### 1.2 核心逻辑：scrollToBottom(immediate)

```ts
function scrollToBottom(immediate = false) {
  const el = getScrollContainer()
  if (!el) return
  if (!immediate && !shouldAutoScroll.value) return

  if (immediate) {
    el.scrollTop = el.scrollHeight
    return
  }

  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    scrollTimeout = null
    const target = getScrollContainer()
    if (target) target.scrollTop = target.scrollHeight
  }, 50)
}
```

- `scrollToBottom()`：流式追加时防抖滚动（50ms）
- `scrollToBottom(true)`：完成态、切换会话时立即滚动

### 1.3 触发时机

| 场景           | 调用方式              |
|----------------|-----------------------|
| 流式输出中     | `scrollToBottom()`     |
| 流式完成       | `scrollToBottom(true)` |
| 切换会话       | `scrollToBottom(true)` |
| 用户上滑后     | 不滚动（`shouldAutoScroll=false`） |
| 点击「回到底部」| `scrollToBottom(true)` |

### 1.4 用户滚动检测

通过 BubbleList 的 `onScroll` 和/或外层容器的 `scroll` 事件，判断是否在底部（如距底部 ≤80px），更新 `shouldAutoScroll`。用户上滑时暂停自动滚动，显示「回到底部」按钮。

---

## 2. 文件位置

- `src/components/ChatWindow/MessageList.vue`：滚动逻辑实现
- `src/components/ChatWindow/index.vue`：传递 `streaming`、`session-id` 给 MessageList

---

## 3. 联调排查

1. 容器是否有 `overflow-y: auto` 且高度固定？
2. `getScrollContainer()` 是否返回实际滚动容器（BubbleList 的 nativeElement 或外层 div）？
3. 流式时是否在 `nextTick` 后调用 `scrollToBottom()`？
4. 完成态是否调用 `scrollToBottom(true)`？
5. 若流式卡顿，可调整防抖间隔（30~100ms）。
