---
name: code-to-doc
description: |
  基于已提供的前端源码生成“可复现技术规格文档”，用于组件迁移、跨 UI 库重写或实现交接。

  仅在以下场景使用：
  - 用户要求“读代码后生成文档 / 规格 / handoff spec / migration spec”
  - 用户要求先分析现有组件，再迁移到另一框架或 UI 库
  - 用户希望把源码整理成“另一个 Agent 可直接照着实现”的说明

  不要在以下场景使用：
  - 仅做代码讲解、debug、code review 或直接实现功能
  - 没有可检查的源码、文件路径或代码片段

  默认输出为 Markdown 规格文档。若未指定目标技术栈，则输出实现无关版本。
---

# Code-to-Doc

## 目标

将当前可访问的源码整理为一份可复现技术规格文档。文档必须让另一个 Agent 在不读原源码的前提下实现等价行为，同时明确区分：

- **Observed**：能从源码直接确认的事实
- **Inference**：基于源码结构做出的必要推断，且必须写明依据
- **Unknown**：当前上下文无法确认的信息

本 Skill 的目标不是“解释代码”，而是产出**可执行的 handoff spec**。当源码不完整时，优先暴露缺口，而不是补全猜测。

## Workflow

### Step 1：确认分析范围

先明确以下信息：

1. **主文件**：用户提供的组件、页面或模块文件
2. **可访问依赖**：主文件直接引用的 composables、types、store、API、样式文件
3. **源技术栈**：Vue / React / UI 库 / 状态管理 / 路由 / 请求层
4. **目标技术栈**：若已指定则记录；若未指定，则输出实现无关版本
5. **上下文完整性**：是否缺少关键定义、接口、常量、外部服务说明

若用户明确要求“迁移到某个目标栈”但未给出目标栈，先输出实现无关规格，并在 `Unknowns` 中标记目标栈缺失；只有当映射细节直接影响答案时再追问。

### Step 2：收集源码证据

只基于当前可访问源码记录以下内容：

- 组件职责与使用场景
- Props / Events / Slots / Exposed Methods
- 内部状态、计算属性、数据流
- 生命周期、watch、副作用、异步请求
- UI 结构、交互流程、样式意图
- 边界状态、校验规则、权限或异常处理

读取范围以**主文件 + 直接依赖**为限。不要为了“完整”继续追逐深层依赖；若关键逻辑缺失，直接标记为 `Unknown from available source`。

### Step 3：处理不确定性

遇到缺失信息时，按以下规则处理：

- 源码中不存在：写 `None` 或 `Not applicable`
- 当前上下文缺少定义：写 `Unknown from available source`
- 必须推断时：写 `Inference`，并标注推断依据

禁止虚构以下内容：

- prop 默认值、类型、校验规则
- emit payload 结构
- API 参数、返回结构、错误处理
- 空状态 / 权限态 / loading 行为
- 样式效果或视觉细节

### Step 4：生成规格文档

严格使用下面的固定结构。主文档优先用**实现无关**术语描述行为和界面；源 UI 库与目标 UI 库的映射单独放在迁移章节。

```markdown
# 组件技术规格文档：[组件名]

## 1. Scope & Confidence
- Source files reviewed:
- Source stack:
- Target stack:
- Confidence: High | Medium | Low
- Missing context:

## 2. Module Overview
- Function:
- Use cases:
- Component type:

## 3. Public API
### Props
| Name | Type | Required | Default | Meaning | Constraints | Evidence |
|---|---|---|---|---|---|---|

### Events
| Name | Payload | Trigger | Consumer | Evidence |
|---|---|---|---|---|

### Slots / Exposed Methods
- None / ...

## 4. State & Data Flow
- Internal state:
- Derived state:
- Async data:
- External stores / injected dependencies:
- Data flow summary:

## 5. Behavior & Lifecycle
- On mount / open:
- User actions:
- On close / unmount:
- Side effects:

## 6. UI Structure
- Layout hierarchy:
- Forms:
- Lists / tables:
- Buttons and actions:
- Feedback states:

## 7. Style & Visual Rules
- Layout-related styles:
- Dynamic class / style bindings:
- Visual behaviors that affect reproduction:

## 8. Validation & Edge Cases
- Required field rules:
- Business rules:
- Empty / loading / error / permission states:

## 9. Migration Notes
仅在用户指定目标技术栈时输出。

### Component Mapping
| Source concept | Target concept | Migration note |
|---|---|---|

### Key Differences
1. ...

## 10. Unknowns & Inferences
### Unknowns
- ...

### Inferences
- ...

## 11. Reproduction Checklist
- [ ] Public API is fully source-backed
- [ ] State transitions and side effects are documented
- [ ] UI structure and key interactions are reproducible
- [ ] Validation and edge cases are covered
- [ ] All unknowns are explicitly listed
```

### Step 5：输出规则

- 默认直接在对话中输出 Markdown
- 只有用户明确要求保存为文件时才创建 `.md` 文件
- 未要求文件时，不要擅自决定保存路径
- 未指定目标技术栈时，省略 `Migration Notes` 或标记为 `Not applicable`

### Step 6：自检

输出前逐项确认：

- [ ] 每个关键结论都能回链到源码证据，或明确标记为 `Inference` / `Unknown`
- [ ] 没有把 UI 库组件名当作业务行为描述
- [ ] 没有因为源码缺失而虚构逻辑
- [ ] 所有外部依赖都被显式列出，或标记为未知
- [ ] 文档足以支持另一个 Agent 复现主要功能与交互

若任一项不满足，先补齐文档中的缺口标记，再输出。

## 描述规范

- **组件/控件**：优先写“单选、多选、下拉、分页表格、确认框、消息提示”等通用概念，不要只写 `el-xxx` / `a-xxx`
- **行为**：写“提交前校验、成功后关闭并回传数据”，不要只写框架或库的 API 调用
- **数据**：写字段、类型、来源、取值范围、流向，不写库专属类型名作为主要描述
- **样式**：只记录对复现有影响的布局、显隐、固定、滚动、动态 class、动画或状态切换
- **缺项**：没有就写 `None`、`Not applicable` 或 `Unknown from available source`，不要留空

## 参考文件

按需读取，不要默认全部加载：

- `references/vue3-patterns.md`
  - 当源码使用 Vue 3 Composition API，需要确认 `ref` / `reactive` / `computed` / `watch` / `defineExpose` 语义时读取
- `references/element-plus-to-antdv.md`
  - 当用户指定目标技术栈为 Ant Design Vue，且需要输出组件映射或迁移说明时读取
