---
name: browser-requirement-verification
description: 根据用户提出的需求，通过 cursor-ide-browser 在真实浏览器中完成交互流程、验证效果与逻辑正确性，并在关键步骤保存完整快照（截图与可选 DOM 快照）。适用于“用浏览器跑一遍并留痕”的验收、回归或演示场景。
---

# 需求驱动 · 浏览器验证与快照留存

根据用户提出的**需求**，在真实浏览器中执行完整交互流程，验证**效果、体验与逻辑**，并在关键节点**保存完整快照**（截图 + 可选结构化快照），便于验收、回归或文档留痕。

## 适用场景

- 用户提出一项功能/页面需求，要求“用浏览器实际跑一遍并保存截图”
- 验收某条用户路径的交互体验与业务逻辑是否正确
- 为文档、PR 或演示生成可复现的步骤与视觉证据
- 回归验证：关键流程在改动后是否仍符合预期

不适用于：仅做静态代码/规范审查（用 ui-acceptance-engineer）、或仅写 E2E 测试代码而不在本次对话中执行浏览器。

## 前置条件

1. **MCP**：确保已启用 **cursor-ide-browser**，且可调用 `browser_navigate`、`browser_snapshot`、`browser_click`、`browser_type`、`browser_fill`、`browser_take_screenshot`、`browser_lock`、`browser_unlock` 等工具。
2. **本地服务**：若验证的是本项目的页面，先确认开发服务已运行（如 `pnpm dev`），并确定 base URL（如 `http://localhost:5173`）。
3. **需求明确**：与用户确认目标页面、操作步骤、每步预期结果（界面变化或数据结果）。

## 工作流程

按以下顺序执行，并在关键步骤保存快照。

### 1. 明确需求

- 列出：**目标 URL / 路由**、**操作步骤**、**每步预期**（界面元素、文案、跳转、接口结果等）。
- 若用户描述较简略，先补全步骤与预期再开始操作。

### 2. 打开页面并锁定

- 使用 **browser_tabs**（action: list）查看是否已有可用标签页。
- **browser_navigate** 打开目标 URL；如需新标签可用 `newTab: true`。
- 随后立即 **browser_lock**，再执行后续所有交互（禁止先 lock 再 navigate）。
- 等待策略：用短间隔（如 2s）+ **browser_snapshot** 检查是否加载完成，避免单次长时间 wait。

### 3. 按步骤执行并验证

- 每一步操作前先 **browser_snapshot** 获取当前页面结构与可交互元素 ref，再执行 **browser_click** / **browser_type** / **browser_fill** / **browser_select_option** 等。
- 每步后再次 snapshot 或观察结果，确认：
  - **效果**：界面是否符合预期（元素出现/消失、文案、样式）。
  - **逻辑**：提交后是否跳转正确、数据是否展示正确、错误态是否按预期展示。
- 若遇弹窗（alert/confirm/prompt），在触发前用 **browser_handle_dialog** 指定接受/取消或输入内容。

### 4. 在关键节点保存完整快照

- **截图**：在以下时机调用 **browser_take_screenshot**：
  - 初始页面加载完成；
  - 每个主要操作后的结果（如打开弹窗、提交成功、列表刷新）；
  - 错误态、空态等关键状态。
- **保存位置**：统一放到项目内目录，例如 `doc/e2e-snapshots/` 或 `doc/screenshots/`；若项目已有约定则遵循约定。
- **命名**：`{需求简述}-step{序号}-{步骤简述}.png`，例如 `login-step2-after-submit.png`、`kb-search-step1-initial.png`。可选带日期 `YYYYMMDD`。
- **全页/视口**：需要整页滚动内容时使用 `fullPage: true`；默认视口截图即可时省略。
- **结构化快照（可选）**：对关键步骤可将 **browser_snapshot** 的文本输出追加到同一目录下的 `.md` 报告中，便于后续对比或文档化。

### 5. 结束与报告

- 全部操作与截图完成后调用 **browser_unlock**。
- 输出一份简短**验证报告**（见下方模板），包含：步骤列表、每步对应截图路径、效果与逻辑结论。

## 快照保存规范

| 项目     | 约定 |
|----------|------|
| 目录     | `doc/e2e-snapshots/` 或项目已有的 `doc/screenshots/` |
| 截图格式 | PNG（默认） |
| 命名     | `{需求简述}-step{N}-{步骤简述}.png`，可加 `-YYYYMMDD` |
| 必须截图 | 初始态、每个主要操作后的结果态、错误/空态 |
| 全页     | 仅当需要展示整页滚动布局时使用 `fullPage: true` |

调用示例（MCP 工具）：

- `browser_take_screenshot`：传入 `filename` 为上述目录下的文件名；需要全页时传 `fullPage: true`。
- `browser_snapshot`：可设 `take_screenshot_afterwards: true` 在取快照后自动拍一张截图，或单独调用 `browser_take_screenshot` 以自定义文件名。

## 验证报告模板

在完成浏览器验证与快照保存后，用以下结构输出报告：

```markdown
## 需求浏览器验证报告

**需求简述**：（一句话）

**目标页面/路由**：（URL 或路由）

**验证时间**：（可选）

### 步骤与结果

| 步骤 | 操作 | 预期 | 结果 | 快照 |
|------|------|------|------|------|
| 1 | … | … | 通过/未通过 | doc/e2e-snapshots/xxx-step1-xxx.png |
| 2 | … | … | … | … |

### 效果与逻辑结论

- 交互体验：（是否符合预期）
- 业务逻辑：（是否正确）
- 结论：通过 / 有条件通过 / 不通过

### 快照清单

- （列出本流程中保存的所有截图路径）
```

## 与 cursor-ide-browser 的配合要点

- **顺序**：`browser_navigate` → `browser_lock` → 交互与截图 → `browser_unlock`。已有标签时可直接 `browser_lock` 再操作。
- **交互前**：先用 **browser_snapshot** 拿到当前 DOM/可访问性树和元素 ref，再 click/type/fill，避免盲目操作。
- **等待**：用短间隔 + 多次 snapshot 判断“是否加载/更新完成”，而不是固定长 wait。
- **截图用途**：`browser_take_screenshot` 用于留痕与报告；基于截图无法做后续自动化操作，后续操作仍依赖 **browser_snapshot**。

## 可选：保存 snapshot 文本

若需“完整快照”包含页面结构，可在关键步骤将 **browser_snapshot** 的返回内容写入 `doc/e2e-snapshots/{需求简述}-step{N}-snapshot.md`，并在报告“快照清单”中注明，便于日后对比或交接。

## 更多示例

具体场景与报告片段见 [examples.md](examples.md)。
