# 分身创建向导 (AvatarWizard) UI/UX 优化方案

> **设计系统来源**: ui-ux-pro-max — Mediverse Management（Healthcare SaaS）  
> **层级**: 优先遵循 `design-system/mediverse-management/pages/avatar-wizard.md`，其余见 `MASTER.md`  
> **交付对象**: 前端开发 (frontend-developer)

---

## 一、设计系统摘要

### 1.1 设计原则
- **风格**: Accessible & Ethical — 高对比、16px+ 正文、键盘可操作、WCAG 友好、语义化
- **模式**: Funnel 渐进披露 — 每步只展示必要信息，明确进度，每步有「下一步」、最后一步主 CTA「确认创建」
- **色彩**: 主色 `#0891B2`（青）、CTA/确认 `#059669`（绿）、背景 `#ECFEFF`、正文 `#164E63`
- **字体**: 标题 Figtree、正文 Noto Sans（可与现有 Ant Design 字体并存，用于向导内标题/描述）
- **交互**: 150–300ms 过渡、44px 最小点击区、明显 focus 环、无 emoji 图标、所有可点击元素 `cursor-pointer`

### 1.2 必须避免
- 亮霓虹色、大范围动效、紫/粉渐变
- 仅用 placeholder 无 label 的输入
- 提交后无 loading/成功反馈

---

## 二、当前结构（保持不变）

- **AvatarWizard.vue**: 弹窗容器 + a-steps + 步骤内容 + 底部按钮区
- **StepType / StepScope / StepInfo / StepConfirm**: 四个子步骤，数据与校验逻辑不修改

---

## 三、优化项与实现要点

### 3.1 弹窗容器 (AvatarWizard.vue)

| 项目 | 当前 | 优化后 |
|------|------|--------|
| 宽度 | `width="60%"` | 固定最大宽度 + 响应式：`max-width: 640px`，小屏 `width: 90vw`，避免过宽 |
| 步骤条 | 默认 a-steps | 保持 a-steps，增加「Step x of 4」辅助文案（可放在步骤条下方或标题旁），满足 UX 进度可见性 |
| 内容区 | 无最小高度 | 给步骤内容区设 `min-height: 280px`，避免步骤切换时高度骤变 |
| 底部按钮 | `flex justify-end gap-2` | 保持右对齐；「上一步」用 default 按钮，「下一步/确认创建」用 primary；确保按钮至少 44px 高、`cursor-pointer`、hover 有 200ms 过渡 |
| 无障碍 | 未强调 | Modal 设置 `aria-labelledby` / `aria-describedby` 指向标题与当前步骤描述；关闭按钮确保 `aria-label` |

**建议类名 / 结构**（不改变现有逻辑，仅加 class 与样式）:
- 弹窗根节点: `class="avatar-wizard-modal"`
- 步骤条包裹: `class="avatar-wizard-steps"`
- 步骤内容包裹: `class="avatar-wizard-content"`，内层 `min-height: 280px`
- 底部: `class="avatar-wizard-footer"`，按钮加 `transition-colors duration-200`

---

### 3.2 Step 1 — 选择类型 (StepType.vue)

| 项目 | 当前 | 优化后 |
|------|------|--------|
| 选项卡片 | `border border-gray-200 rounded`，无 hover | 卡片可点击区域扩大（整卡可点）、hover 时边框/背景轻微变化（如 border-primary/20、bg 浅色）、`cursor-pointer`、`transition-colors duration-200` |
| 选中态 | 仅 radio 选中 | 选中卡片增加明显边框与背景（如 primary 边框 + 浅青背景），与未选中区分清晰 |
| 对比与可读 | 描述 `text-gray-500` | 确保与背景对比度 ≥4.5:1（如 `text-slate-600` dark 下 `text-slate-400`） |
| 间距 | `gap-2` | 选项之间 `gap-3` 或 `space-y-3`，与设计系统 `--space-md` 一致 |

**实现要点**:
- 用 `label` 包住整块卡片并关联 `a-radio`，或给卡片加 `@click` 触发当前 radio 的选中，保证键盘与点击都可操作
- 不使用 emoji；若需图标，用 Ant Design Icons 或 Lucide 的 SVG

---

### 3.3 Step 2 — 绑定范围 (StepScope.vue)

| 项目 | 当前 | 优化后 |
|------|------|--------|
| 表单项 | 默认 a-form vertical | 保持；确保每个 a-form-item 有 label（已有），无 placeholder-only 输入 |
| 级联关系 | 机构 → 科室 → 用户 | 视觉上可加简短说明文案（如「请先选择机构，再选择科室」），放在表单上方或机构表单项下方，`text-slate-600` 小字 |
| 禁用态 | 未选机构时科室禁用 | 保持；禁用时仍要可见、对比度足够，避免「看不见」的控件 |

无大改结构，仅加强说明与对比度即可。

---

### 3.4 Step 3 — 基础信息 (StepInfo.vue)

| 项目 | 当前 | 优化后 |
|------|------|--------|
| 表单布局 | 单列 vertical | 保持；字段多时可考虑两列布局（如 name + avatar_url 同一行），但非必须，以可读为准 |
| 标签与字数 | 有 show-count | 保持；确保 label 与输入关联，focus 时输入框有清晰 focus 环（Ant Design 默认或补一层 3px primary 浅色 ring） |
| 沟通风格 | 一排 a-radio | 可改为小块卡片式选择（与 StepType 一致），或保持 radio 组但加大点击区、加 hover 态 |

实现时优先保证 label、focus、对比度，再考虑与 StepType 风格统一。

---

### 3.5 Step 4 — 确认预览 (StepConfirm.vue)

| 项目 | 当前 | 优化后 |
|------|------|--------|
| 展示 | a-descriptions 单列 bordered | 保持；可增加区块标题「请确认以下信息」、与上方步骤条视觉分隔 |
| 可读性 | 小字 size="small" | 确保正文字号 ≥14px、行高舒适，颜色对比度 ≥4.5:1 |
| 链接 | avatar_url 为 a 链接 | 保持；链接要有 hover/focus 态，`cursor-pointer` |

---

## 四、全局与主题对接

- **与现有项目一致**: 当前为 Ant Design Vue + Tailwind，不强制引入 Figtree/Noto Sans 到全局；若仅在本向导内使用，可在 `AvatarWizard.vue` 或父级用 scoped 样式或一层 wrapper 的 class 设置 `font-family`。
- **色值**: 若项目已有 `--color-primary` / Ant Design 主题，优先用现有 primary；若无，可采用设计系统 `#0891B2` / `#059669` 仅在本向导内通过 class 或 CSS 变量覆盖（如 `.avatar-wizard-modal .ant-btn-primary`）。
- **暗色**: 若支持 dark mode，确保步骤卡片、描述、按钮在暗色下对比度仍达标（见 MASTER 与 Pre-Delivery Checklist）。

---

## 五、Pre-Delivery 检查清单（前端交付前自检）

- [ ] 无使用 emoji 作为图标（使用 SVG / Ant Design Icons）
- [ ] 所有可点击元素（卡片、按钮、链接）具备 `cursor-pointer`
- [ ] Hover 态有平滑过渡（150–300ms），且不引起布局位移（避免 scale 导致抖动）
- [ ] 步骤条或标题旁有「Step x of 4」类进度说明
- [ ] 提交时按钮 loading、成功后 message.success，无「点了无反应」
- [ ] 所有输入均有关联 label，非 placeholder-only
- [ ] Focus 态可见（键盘导航可辨）
- [ ] 弹窗宽度在小屏（如 375px）无横向溢出，重要按钮至少 44px 高
- [ ] 若启用 `prefers-reduced-motion`，可考虑减少或关闭非必要动效

---

## 六、文件与职责

| 文件 | 建议修改内容 |
|------|----------------|
| `AvatarWizard.vue` | 弹窗宽度与 class、内容区 min-height、步骤辅助文案、底部按钮样式与无障碍属性 |
| `steps/StepType.vue` | 卡片 hover/选中态、整卡可点、间距与对比度 |
| `steps/StepScope.vue` | 可选简短说明文案、禁用态对比度 |
| `steps/StepInfo.vue` | 可选两列布局、focus 环、可选风格卡片化 |
| `steps/StepConfirm.vue` | 区块标题、字号与对比度、链接 hover/focus |

**不修改**: 数据流、校验逻辑、i18n key、API 调用、步骤切换与提交逻辑。

---

## 七、交付说明

本方案由 ui-ux-pro-max 设计系统生成并已持久化（Mediverse Management — avatar-wizard 页覆盖）。前端开发按第三节逐项实现即可；若有布局或组件库限制，可在不违背「无障碍、对比度、进度可见、提交反馈」的前提下微调实现方式。
