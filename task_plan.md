# 暗黑主题合规整改 — 任务计划

## 目标

消除暗黑模式下的显示错误，把三套 token 通道统一指向 `variables.css` 单一真相源，并建立防回潮守卫。

## 总体策略

保留三条通道（CSS 变量 / Tailwind `@theme` / antdv token），让它们全部引用 `variables.css` 的语义变量；色值只定义一遍。详见 `findings.md`。

## 关键决策（ADR）

- **D1**：以 `variables.css` 的 `--color-*` 为唯一真相源；Tailwind `@theme` 与组件 `<style>` 一律引用，不重写值。
- **D2**：antdv seed token 不能用 `var()`（algorithm 需真实色值）→ 主色色值抽到 TS 常量 `config/tokens.ts`，同时喂 `themes.ts` 与 variables.css 兜底值，消除重复。
- **D3**（已修正）：目标不变——让工具类跟随主题、避免逐处 `dark:`。手段改为**沿用项目既有的 `xxx-(--color-yyy)` 任意值语法**（如 `text-(--color-text-base)`，全站已 70+ 处），不再新增 `@theme` 别名。原因：别名 `text-base` 与 Tailwind 内置字号类冲突，且与既有语法重复。阶段 0 已新增的 6 行 `@theme` 别名及对应测试已回滚。
- **D4**：特殊语义色（diff、代码块）新增专用变量，亮暗各定义一次。
- **D5**：分阶段独立提交，每阶段可单独验证（暗黑切换目检 + `pnpm verify`）。

## 阶段拆分

### 阶段 0 — 建立单一真相源（基建，无可见变化）

- [x] 新建 `src/config/tokens.ts`，定义 `brandTokens.primary = { light:'#0EA5E9', dark:'#38BDF8' }`
- [x] `themes.ts` 引用 `brandTokens`，删除字面量重复
- [x] `variables.css` 主色注释标注真值来源（保留 CSS 兜底）
- [x] ~~`index.css @theme` 补语义别名~~ → **已回滚**（见 D3）：`text-base` 与 Tailwind 内置字号类冲突且与既有语法重复；统一沿用既有 `xxx-(--color-yyy)` 任意值语法
- [x] `variables.css` 新增 `--color-diff-add/-del`、`--color-code-bg`（亮暗各一份）
- 验证：`pnpm verify` 通过；本阶段未替换页面样式，预期 UI 无变化

### 阶段 1 — 修类别 A（暗黑可见 bug，最高优先级）

- [x] `KBSidebar/index.vue` — 整侧边栏 → 语义类/变量
- [x] `KnowledgeCardViewer/` 系列（VersionDiffView / JsonContentPane / CardContentBody / VersionTimeline）
- [x] `AvatarConfig/ToolSkillSelector.vue`
- [x] `AvatarDetailModal.vue`、`RecallSourceDetailModal.vue`、`KnowledgeCardEditor` inline
- 验证：`pnpm exec vitest run tests/unit/styleStaticContracts.test.ts` 通过；`pnpm verify` 通过

### 阶段 2 — 类别 C 品牌色收口

- [x] 散落 `#0ea5e9`/`#0284c7`/`bg-[#0ea5e9]` → `var(--color-primary*)` / `bg-primary`
- [x] 局部 `--xxx-color:#0ea5e9` 定义改引用主色变量
- [x] `QuickActionGuide` `#00a0e9` 按 D 决策处理为 `var(--color-primary)`
- 验证：`pnpm exec vitest run tests/unit/styleStaticContracts.test.ts` 通过；`pnpm verify` 通过

### 阶段 3 — 类别 B + D 收尾

- [ ] 类别 B `.dark .xxx` 手写配对迁移到变量（LocaleSwitcher / ThemeSwitcher / StepScope / BubbleRenderer）
- [ ] 类别 D 静态灰工具类 → 既有 `text-(--color-text-secondary)` 等任意值语法
- 验证：暗黑下次要文字对比度达标

### 阶段 4 — 防回潮 + 文档

- [ ] 加 grep 守卫脚本：拦截 `<style>` 内裸 `#fff`/`bg-white`（无 `dark:`/无 `var()`）的新增，挂到 `pnpm verify` 或 lint
- [ ] 更新 `docs/development-guide.md` 第 8 节样式规范，明确「禁止裸色值，统一走变量/语义 token」
- [ ] 更新 `docs/documentation-task-board.md`
- 验证：`pnpm check:docs` + `pnpm verify`

## 验证命令

- 构建/类型：`pnpm verify`
- 文档：`pnpm check:docs`
- 人工：亮/暗/auto 三态切换，重点页：知识库、智能体配置/详情、版本 diff、登录页

## 进度

当前阶段：**阶段 2 已完成并通过验证**；下一步进入阶段 3（类别 B + D 收尾）。
