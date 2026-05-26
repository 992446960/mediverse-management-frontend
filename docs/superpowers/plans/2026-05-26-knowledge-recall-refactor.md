# 召回模块重构计划

## 背景

`src/views/shared/KnowledgeRecallTest.vue` 共 1100 行，包含 4 个独立交互区域（查询面板、结果展示、历史弹窗、详情弹窗），违反开发规范 3.1（页面目录结构）和 3.2（500 行 / 3 个独立区域上限）。本次重构将其拆分为页面目录结构，同时迁移 3 个薄包装页面和更新路由。

不改动的文件：`src/api/knowledgeRecall.ts`、`src/types/knowledgeRecall.ts`、`src/utils/knowledgeRecall.ts`、`src/mocks/handlers/knowledgeRecall.ts`、i18n 文件。

## 目标结构

```
src/views/shared/knowledge-recall-test/
├── index.vue                              (~280行) 页面编排 + 查询参数 + 召回执行
├── components/
│   ├── RecallResultSection.vue            (~130行) answer + sources 列表
│   ├── RecallHistoryModal.vue             (~200行) 历史弹窗，含筛选/表格/加载详情
│   └── RecallSourceDetailModal.vue        (~260行) 知识卡详情弹窗 + 文件预览
└── composables/
    └── useRecallForm.ts                   (~100行) 卡片类型加载/缓存/选中切换

src/views/my/knowledge-recall-test/index.vue      (14行，薄包装)
src/views/org/knowledge-recall-test/index.vue      (14行，薄包装)
src/views/dept/knowledge-recall-test/index.vue     (14行，薄包装)
```

## 实施步骤

### Step 1: 创建 composable — `useRecallForm.ts`

从原文件提取卡片类型加载/缓存/选中切换逻辑：

| 类别 | 内容 |
|---|---|
| 常量 | `CARD_TYPES_CACHE_KEY` |
| Refs | `cardTypes`、`cardTypesLoading`、`selectedAllCardTypes`、`selectedCardTypes` |
| Computed | `availableCardTypes`、`hasSelectedCardType` |
| 函数 | `fetchCardTypes`、`readCachedCardTypes`、`writeCachedCardTypes`、`isCardTypeOption`、`syncAllCardTypesSelection`、`isCardTypeActive`、`handleCardTypeClick` |
| 依赖 | `getCardTypes`（api/knowledge）、`resolveRecallCardTypeSelection`、`ALL_RECALL_CARD_TYPES_VALUE`（utils/knowledgeRecall） |

composable 额外暴露 `resetCardTypes()` 供主页面的 `handleReset` 调用，内部执行 `selectedAllCardTypes = true; selectedCardTypes = [...availableCardTypes]`。

### Step 2: 创建三个子组件（可并行）

#### 2a. `RecallResultSection.vue`

| 项 | 内容 |
|---|---|
| Props | `result: KnowledgeRecallViewModel \| null`、`loading: boolean` |
| Emits | `open-source-detail(source: KnowledgeRecallViewSource)` |
| 模板来源 | 原文件 L144-237（loading 遮罩、空态、answer 区含 MessageOutlined 图标、sources 列表含 FileTextOutlined 图标和 truncate 标题） |
| 逻辑 | `hasFinalAnswer`、`finalAnswerHtml`、`queryTimeText`、`confidenceText`、`sourceCount`、`formatScore`、`getLocalizedCardTypeConfig` |
| 图标导入 | `FileTextOutlined`、`MessageOutlined` |
| 样式 | `.knowledge-recall-test__answer-body` 系列、`.knowledge-recall-test__sources-list` |

#### 2b. `RecallHistoryModal.vue`

| 项 | 内容 |
|---|---|
| Props | `open: boolean`（v-model）、`ownerType`、`ownerId`、`cardTypes: CardTypeOption[]` |
| Emits | `update:open`、`select(view: KnowledgeRecallViewModel)` |
| 模板来源 | 原文件 L239-268（a-modal + PageFilter + PageTable） |
| Refs | `historyLoading`、`historyDetailLoading`、`historyRows`、`historyTotal`、`historyFilterRef`、`historyTableRef` |
| Computed | `historyStatusOptions`、`historyCardTypeOptions`、`historyFilterConf`、`historyTableConf`、`historyTableColumns`（含 fixed: 'right' 操作列） |
| 函数 | `fetchHistory`、`handleHistorySearch`、`handleSelectHistory`、`formatHistoryCardType`、`formatHistoryStatus`、`getHistoryStatusColor`、`canViewHistoryDetail` |
| 行为 | `watch(() => props.open, (v) => { if (v) fetchHistory() })`；选中历史后 emit `select` 并关闭 |
| 图标导入 | `SearchOutlined` |
| 样式 | `.knowledge-recall-history__filter`、`.knowledge-recall-history__table` |

去掉 header 历史按钮的 `:loading` 绑定，弹窗内已有自己的 loading 指示。

#### 2c. `RecallSourceDetailModal.vue`

| 项 | 内容 |
|---|---|
| Props | `open: boolean`（v-model）、`source: KnowledgeRecallViewSource \| null` |
| Emits | `update:open` |
| 模板来源 | 原文件 L270-394（标题栏、previewContentFallback 提示 a-alert、markdown 内容区、侧边栏分数+可点击文件卡片） |
| Refs | `openingSourceFileKey`（文件预览 loading 态） |
| Computed | `detailTitle`、`detailCardId`、`detailCardType`、`detailUpdatedAt`、`detailMarkdown`、`hasDetailMarkdown`、`detailMarkdownHtml`、`detailUsesPreviewContent`、`selectedRecallScore`、`selectedRecallScoreText`、`selectedRecallScorePercent`、`detailSourceFiles` |
| 函数 | `handleCloseDetail`、`getSourceFileName`、`getSourceFileKey`、`getSourceFilePreviewUrl`、`openSourceFileByUrl`、`handleOpenSourceFile`、`getSourceFileMeta` |
| 图标导入 | `FileTextOutlined`、`BarChartOutlined`、`LinkOutlined` |
| 依赖 | `dayjs`、`renderMarkdownSafe`、`formatFileSize`、`openFilePreview`（utils/fileType）、`getCardTypeConfig`、`message`（ant-design-vue） |
| 样式 | `.knowledge-recall-detail*` 全部规则、`.knowledge-recall-detail__file-card*` 系列（含 hover/focus/loading/dark）、`@media (max-width: 900px)` |

### Step 3: 创建主页面 `index.vue`

| 项 | 内容 |
|---|---|
| 模板 | header（L3-46，去掉历史按钮 :loading）、查询输入+参数面板（L48-134，含 QuestionCircleOutlined 图标）、结果分割线（L136-142）、三个子组件 |
| Composable | `useRecallForm()` 管理卡片类型 |
| Refs | `query`、`topK`、`loading`、`result`、`detailOpen`、`selectedSource`、`historyOpen` |
| Computed | `canSubmit`、`canReset`、`normalizedTopK` |
| 函数 | `handleRecall`、`handleReset`（调用 composable 的 resetCardTypes）、`handleBack`、`openHistoryModal`（含 loading 防护） |
| 图标导入 | `ArrowLeftOutlined`、`FilterOutlined`、`CaretRightOutlined`、`UndoOutlined`、`HistoryOutlined`、`QuestionCircleOutlined` |
| CSS 导入 | `github-markdown-css`（全局样式，只需在主页面导入一次） |
| 样式 | CSS 变量、`__header`、`__form-grid`、`__top-k-slider :deep`、`__results--placeholder` |

子组件事件协调：
- `RecallResultSection` emit `open-source-detail` → 设置 `selectedSource`，打开详情弹窗
- `RecallHistoryModal` emit `select(view)` → 回填 result、query、topK、卡片类型选中状态，清空 selectedSource
- `RecallSourceDetailModal` 通过 v-model:open 控制

### Step 4: 迁移薄包装页面

| 原路径 | 新路径 | 改动 |
|---|---|---|
| `src/views/my/KnowledgeRecallTest.vue` | `src/views/my/knowledge-recall-test/index.vue` | import 路径更新 |
| `src/views/org/KnowledgeRecallTest.vue` | `src/views/org/knowledge-recall-test/index.vue` | import 路径更新 |
| `src/views/dept/KnowledgeRecallTest.vue` | `src/views/dept/knowledge-recall-test/index.vue` | import 路径更新 |

### Step 5: 更新路由

`src/router/routes.ts` 三处 component 路径：

| 行号 | 原路径 | 新路径 |
|---|---|---|
| L213 | `@/views/my/KnowledgeRecallTest.vue` | `@/views/my/knowledge-recall-test/index.vue` |
| L272 | `@/views/dept/KnowledgeRecallTest.vue` | `@/views/dept/knowledge-recall-test/index.vue` |
| L330 | `@/views/org/KnowledgeRecallTest.vue` | `@/views/org/knowledge-recall-test/index.vue` |

### Step 6: 验证

- 运行 `pnpm verify`（类型检查 + 构建）
- 启动 `pnpm dev`，访问三个入口页面验证功能

### Step 7: 删除旧文件 + 再次验证

删除 4 个旧文件，再跑一次 `pnpm verify` 确认无残留引用。

## 验证清单

- [ ] `pnpm verify` 通过
- [ ] 三个入口（my/org/dept）页面可正常渲染
- [ ] 召回查询、卡片类型选择、TopK 滑块正常
- [ ] 召回执行和结果展示正常（含 MessageOutlined 图标、sources 文件图标和 truncate 标题）
- [ ] 历史弹窗打开、筛选、翻页、选中回填正常（操作列 fixed: right）
- [ ] 知识卡详情弹窗展示正常（markdown、previewContentFallback 提示、分数、关联文件）
- [ ] 关联文件点击可预览（含 loading 态）
- [ ] 重置和返回按钮正常
- [ ] 无旧文件残留引用
