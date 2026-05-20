# 知识卡召回测试功能实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在知识卡管理页新增隐藏入口，进入知识卡召回测试页，支持输入问题、设置知识卡类型与 Top-K，执行 `/knowledge-recall/{owner_type}/{owner_id}/recall` 后展示最终回答和召回知识卡列表。

**Architecture:** 召回测试作为知识卡管理下的隐藏子页面实现，不进入侧栏菜单；API 层独立封装 `knowledgeRecall` 模块，页面复用 `PageHead`、Ant Design Vue 表单和项目现有色彩/容器风格；本地 MSW 补 deterministic mock 便于 Chrome 测试。

**Tech Stack:** Vue 3 + TypeScript, Vue Router, Ant Design Vue, MSW, Vitest, Chrome browser automation

---

## 验收标准

- 知识卡管理页顶部存在“召回测试”入口，个人、科室、机构工作台均可从各自知识卡管理页进入。
- 新页面 URL 位于知识卡管理路径下，例如 `/my/knowledge-cards/recall-test`，且侧栏菜单不新增“召回测试”菜单项。
- 隐藏页进入后仍保持当前工作台权限约束，个人页需要 `user`，科室页继承 `dept_admin`，机构页继承 `org_admin`。
- 页面样式遵守项目现有风格：使用 `app-container`、`PageHead`、Ant Design Vue 控件，不照搬参考图的大标题和独立视觉体系。
- 用户必须输入问题后才能执行测试；执行中按钮 loading/disabled，避免重复提交。
- 知识卡类型支持“全部”和后端 `GET /knowledge/card-types` 返回的类型；选择“全部”时不传 `metadata.card_type`，选择具体类型时传字符串数组。
- Top-K 支持 1-20，默认 5。
- 请求成功后展示最终回答、召回知识卡列表、命中数量、耗时和置信度。
- 不实现测试历史、历史详情、删除历史入口。
- 修改代码、接口调用和文档后同步更新 `docs/documentation-task-board.md`。

## 测试标准

- 单元测试覆盖召回请求 payload 构造：
  - `cardTypes=[]` 或全部类型时不生成 `metadata.card_type`。
  - 选择具体类型时生成 `metadata.card_type` 数组。
  - `top_k` 固定进入请求体。
- 运行 `pnpm exec vitest run tests/unit/knowledgeRecall.test.ts`，先观察失败，再实现通过。
- 运行 `pnpm verify`，验证文档新鲜度和生产构建。
- Chrome 测试流程必须覆盖：
  - 启动本地开发服务。
  - 打开知识卡管理页。
  - 点击“召回测试”入口。
  - 输入测试问题。
  - 设置知识卡类型与 Top-K。
  - 点击“执行测试”。
  - 观察 loading 出现并在成功后消失。
  - 验证页面出现“最终回答”和“召回知识卡”结果列表。
  - 验证菜单未新增召回测试项。
- Chrome 测试通过后再进行代码验收、分功能提交和推送。

## 任务拆分

### Task 1: 召回请求合同与单元测试

**Files:**
- Create: `tests/unit/knowledgeRecall.test.ts`
- Create: `src/types/knowledgeRecall.ts`
- Create: `src/utils/knowledgeRecall.ts`
- Create: `src/api/knowledgeRecall.ts`

- [x] 写失败测试，锁定 payload 构造规则。
- [x] 实现类型、payload 构造 helper 和 API 封装。
- [x] 运行单测确认通过。

### Task 2: 路由与入口

**Files:**
- Modify: `src/types/router.ts`
- Modify: `src/layouts/MainLayout.vue`
- Modify: `src/router/routes.ts`
- Modify: `src/components/KnowledgeCardList/index.vue`

- [x] 新增隐藏路由和 `activeMenu` 类型。
- [x] 让隐藏页保持知识卡管理菜单高亮。
- [x] 在知识卡管理页新增“召回测试”按钮。

### Task 3: 召回测试页面

**Files:**
- Create: `src/views/shared/KnowledgeRecallTest.vue`
- Create: `src/views/my/KnowledgeRecallTest.vue`
- Create: `src/views/dept/KnowledgeRecallTest.vue`
- Create: `src/views/org/KnowledgeRecallTest.vue`
- Modify: `src/i18n/locales/zh-CN.ts`
- Modify: `src/i18n/locales/en-US.ts`

- [x] 实现问题输入、类型选择、Top-K 设置和执行按钮。
- [x] 实现 loading、空态、最终回答和召回知识卡列表。
- [x] 增加中英文文案。

### Task 4: Mock 与文档

**Files:**
- Create: `src/mocks/handlers/knowledgeRecall.ts`
- Modify: `src/mocks/handlers.ts`
- Modify: `docs/documentation-task-board.md`

- [x] 新增 MSW mock，响应结构对齐 API 设计 §4.4.5。
- [x] 更新文档任务看板，说明新增隐藏召回测试页。

### Task 5: 验收、Chrome 测试、提交推送

- [x] 运行 `pnpm exec vitest run tests/unit/knowledgeRecall.test.ts`。
- [x] 运行 `pnpm verify`。
- [x] 启动 `pnpm dev`。
- [x] 使用 Chrome 执行 UI 检查并记录测试限制；用 Playwright 补充完整点击流程验证。
- [x] 对照验收标准逐项验收代码。
- [x] 按功能拆分 commit。
- [x] 推送到当前分支跟踪远端。
