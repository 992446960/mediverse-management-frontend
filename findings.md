# 暗黑主题整改 — 研究与发现

## 一、现有主题机制（合规基线）

三层 token 通道，**通道多不是问题，真值分裂才是问题**：

| 通道 | 文件 | 作用域 | 现状 |
|---|---|---|---|
| 自定义 CSS 变量 `--color-*` | `src/styles/variables.css` | 模板 `style`/`<style>` | 唯一真相源候选，`:root` 亮色 + `:root[data-theme='dark']` 暗色覆盖 |
| Tailwind `@theme` token | `src/styles/index.css` | `class="bg-primary"` | 已正确桥接（`--color-primary: var(--color-primary)`），但只映射了 primary/success/warning/error/info |
| antdv `--ant-*` token | `src/config/themes.ts` | Ant 组件内部 | 经 `darkAlgorithm` 派生；**主色硬编码，与 variables.css 重复** |

切换驱动：`src/stores/theme.ts` → `<html>` 加 `.dark` class + `data-theme="dark"` 属性。
- `.dark` class 驱动 Tailwind `dark:` 变体与手写 `.dark .xxx` 规则
- `data-theme="dark"` 属性驱动 variables.css 的变量覆盖
- antdv 由 `App.vue` 的 `a-config-provider :theme` 切换（`isDark ? darkThemeConfig : themeConfig`）

### 关键约束
- **antdv seed token（`colorPrimary` 等）不能写 `var(--color-primary)`** —— darkAlgorithm 要在 JS 里基于真实色值派生 `--ant-*`，拿不到 `var()`。共享真值需把色值放 TS 常量，同时喂 antdv 与 CSS 变量。

## 二、不合规分类清单

### 类别 A — 浅色硬编码且无暗黑回退（暗黑下直接显示错误，最高优先级）

| 文件 | 位置/形态 | 症状 |
|---|---|---|
| `components/KBSidebar/index.vue` | `bg-white border-gray-200 text-gray-700 hover:bg-gray-100`（class，多处） | 知识库侧边栏暗黑下纯白 |
| `components/AvatarConfig/ToolSkillSelector.vue` | `background:#fff`(:233) `color:#111827`(:268) `#6b7280`(:199/:277) | 面板白底黑字 |
| `components/KnowledgeCardViewer/VersionDiffView.vue` | `.diff-delete #fdd`(:282) `.diff-insert #dfd`(:288) + `bg-gray-50` 容器 | 浅红浅绿 diff + 浅灰面板 |
| `components/KnowledgeCardViewer/JsonContentPane.vue` | `bg-gray-50`(class) | 内容面板浅灰 |
| `components/KnowledgeCardViewer/CardContentBody.vue` | `bg-gray-50`(class) | 内容面板浅灰 |
| `components/KnowledgeCardViewer/VersionTimeline.vue` | `text-gray-800`/`text-gray-600`(class) | 近黑文字暗底不可读 |
| `views/admin/Avatars/components/AvatarDetailModal.vue` | `color:#1677ff`(:423) `background:#e7f3ff`(:426) | 浅蓝标签块 |
| `views/shared/knowledge-recall-test/components/RecallSourceDetailModal.vue` | `background:#fff`(:310) | 白底面板 |
| `components/KnowledgeCardEditor/index.vue` | inline `style="background:#fff"`(:57) | 上传区白底 |

### 类别 B — 用 `.dark .xxx` 手写硬编码配对（能显示，但绕过变量体系，维护双轨）

| 文件 | 形态 |
|---|---|
| `components/LocaleSwitcher/index.vue` | `.dark .locale-text{color:#94a3b8}` 等手写亮暗两套 |
| `components/ThemeSwitcher/index.vue` | `.dark .sun-icon/.moon-icon` 手写 |
| `views/admin/Avatars/components/steps/StepScope.vue` | `#fff !important`(:316) 亮 + `.dark ... #1f2937/#374151`(:339-344) 暗，双轨硬编码 |
| `components/ChatWindow/BubbleRenderer.vue` | `pre #f6f8fa`(:77) + `.dark pre #161b22`(:84)，已配对但用硬编码 |

### 类别 C — 品牌/语义色硬编码而非变量（暗黑主色应切 `#38BDF8`，硬编码不跟随）

- **结构性重复**：`config/themes.ts` 主色 `#0EA5E9`/`#38BDF8` 与 `variables.css` `--color-primary-500` 重复定义（单一真相源破裂的根因）
- 散落 `#0ea5e9`/`#0284c7`：`ToolSkillSelector`(:212/:258)、`AvatarWizard`(`bg-[#0ea5e9]` :85/:94)、`OrgForm`(`hover:border-[#0ea5e9]` :52)、`AvatarConfig/index.vue`(:415)、`knowledge-recall-test/index.vue`(:304)
- 局部 CSS 变量用硬编码品牌色定义：`AvatarStyleSelector`(:121-137)、`steps/StepType`(:142-153)、`AdvancedTagList`(:71/:75)、`AdvancedConfigFields`(:422/:588-596)、`AvatarDetailModal`(:481-489)、`AvatarEditModal`(:547-559)
- `QuickActionGuide`(:59/:108/:124) 用 `#00a0e9`（非项目主色，色值游离）

### 类别 D — 中性灰工具类（暗黑对比度不足，非致命）

`text-gray-500/600/700/800`、`text-slate-500`、`bg-gray-50` 散落：`KnowledgeCardViewer/index.vue`(多处 label)、`JsonContentPane`、`CardContentBody`、`VersionTimeline`、`KBSidebar`、`PageHead`(:`text-slate-500`)、`PageTable`、`ChatWindow/MessageList`、`CitationPreviewHtml`。

### 需新增的特殊语义变量
- diff 增/删底色：`--color-diff-add` / `--color-diff-del`
- 代码块底色：`--color-code-bg`（统一 BubbleRenderer 等）

### 合规、无需改（避免误判）
- `var(--color-*, #fff)` 带回退形态（`TagsView`、`AvatarSelector`、`ToolSkillSelector` 的 border 等）—— 暗黑下变量生效
- `KnowledgeCardPreview/index.vue`(:66-69) 分类标签语义色映射 —— 分类语义色亮暗可共用，建议后续提取为变量但不阻塞

## 三、替换映射表

| 硬编码 | 替换为 |
|---|---|
| `background:#fff` / `bg-white` | `var(--color-bg-container)` / Tailwind `bg-surface` |
| `bg-gray-50` 内容面板 | `var(--color-bg-layout)` / `bg-surface-sunken` |
| `color:#111827` / `#333` / `text-gray-800` | `var(--color-text-base)` / `text-content` |
| `color:#6b7280` / `text-gray-500/600` | `var(--color-text-secondary)` / `text-content-secondary` |
| `#94a3b8` / `text-gray-400` | `var(--color-text-tertiary)` |
| `#0ea5e9` / `#0284c7` / `bg-[#0ea5e9]` | `var(--color-primary)` / `var(--color-primary-hover)` / `bg-primary` |
| `border-gray-200` / `#e5e7eb` | `var(--color-border)` / `border-default` |
| `.diff-delete #fdd` / `.diff-insert #dfd` | `var(--color-diff-del)` / `var(--color-diff-add)` |
| 代码块 `#f6f8fa`/`#161b22` 配对 | `var(--color-code-bg)` |

## 四、已决策（原开放问题）
- **Tailwind 语义写法**（最终）：不新增 `@theme` 别名，统一沿用项目既有的 `xxx-(--color-yyy)` 任意值语法（如 `text-(--color-text-base)`、`bg-(--color-bg-container)`，全站已 70+ 处）。原因：别名 `text-base` 撞 Tailwind 内置字号类、且与既有语法重复。阶段 0 误加的别名已回滚。
- **`QuickActionGuide` 的 `#00a0e9`**：统一成 `var(--color-primary)`，暗黑下自动切 `#38BDF8`（视为手误/无特殊诉求）
