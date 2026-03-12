# Mediverse Management 前端开发计划索引

> 项目目录：`mediverse-management-frontend/`  
> 技术栈：Vue 3 + TypeScript + Ant Design Vue 4.x + Ant Design X Vue + Pinia + Vue Router v4 + Vite 5.x + UnoCSS + @antfu/eslint-config

---

## 计划总览

| 编号 | 计划名称 | 来源阶段 | 前置依赖 | 主执行智能体 |
|------|---------|---------|---------|-------------|
| 01 | [项目脚手架与工程配置](./plan-01-项目脚手架与工程配置.md) | Phase 1 | 无 | frontend-developer |
| 02 | [全局类型定义与 API 请求层](./plan-02-全局类型定义与API请求层.md) | Phase 1 | Plan 01 | frontend-developer |
| 03 | [认证模块（登录/登出/Token）](./plan-03-认证模块.md) | Phase 1 | Plan 02 | frontend-developer |
| 04 | [主布局与权限体系](./plan-04-主布局与权限体系.md) | Phase 1 | Plan 03 | frontend-developer |
| 05 | [机构管理模块](./plan-05-机构管理模块.md) | Phase 2 | Plan 04 | frontend-developer |
| 06 | [科室管理模块（含 OrgDeptTree）](./plan-06-科室管理模块.md) | Phase 2 | Plan 05 | frontend-developer |
| 07 | [用户管理模块](./plan-07-用户管理模块.md) | Phase 2 | Plan 06 | frontend-developer |
| 08 | [分身管理模块（含向导式创建）](./plan-08-分身管理模块.md) | Phase 2 | Plan 05 | frontend-developer |
| 09 | [文件管理通用组件集](./plan-09-文件管理通用组件集.md) | Phase 3 | Plan 04 | frontend-developer |
| 10 | [知识卡通用组件集](./plan-10-知识卡通用组件集.md) | Phase 3 | Plan 09 | frontend-developer |
| 11 | [分身配置与统计组件](./plan-11-分身配置与统计组件.md) | Phase 3 | Plan 09 | frontend-developer |
| 12 | [三级工作台页面集成](./plan-12-三级工作台页面集成.md) | Phase 3 | Plan 09, 10, 11 | frontend-developer |
| 13 | [SSE 流式对话核心能力](./plan-13-SSE流式对话核心能力.md) | Phase 4 | Plan 04 | frontend-developer |
| 14 | [数字医生体验完整页面](./plan-14-数字医生体验完整页面.md) | Phase 4 | Plan 13, 12 | frontend-developer |
| 15 | [知识库搜索模块](./plan-15-知识库搜索模块.md) | Phase 5 | Plan 13, 14, 10 | frontend-developer |
| 16 | [仪表盘与 API Token 管理](./plan-16-仪表盘与APIToken管理.md) | Phase 6 | Plan 04 | frontend-developer |
| 17 | [国际化完善与性能优化](./plan-17-国际化完善与性能优化.md) | Phase 6 | Plan 01~16 | frontend-developer, verifier |

---

## 依赖关系图

```
Plan 01 (脚手架)
  └─► Plan 02 (类型+API)
       └─► Plan 03 (认证)
            └─► Plan 04 (布局+权限)
                 ├─► Plan 05 (机构管理)
                 │    ├─► Plan 06 (科室管理)
                 │    │    └─► Plan 07 (用户管理)
                 │    └─► Plan 08 (分身管理)
                 │
                 ├─► Plan 09 (文件组件) ──────────────────┐
                 │    ├─► Plan 10 (知识卡组件) ───────────┤
                 │    └─► Plan 11 (分身配置组件) ─────────┤
                 │                                       ▼
                 │                              Plan 12 (工作台集成)
                 │
                 ├─► Plan 13 (SSE核心) ──► Plan 14 (对话页面) ──► Plan 15 (知识搜索)
                 │
                 └─► Plan 16 (仪表盘+Token)

Plan 01~16 全部完成 ──► Plan 17 (国际化+性能)
```

---

## 可并行开发路径

```
路径 A（管理后台线）:  Plan 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08
路径 B（工作台线）:    Plan 01 → 02 → 03 → 04 → 09 → 10 → 11 → 12
路径 C（对话线）:      Plan 01 → 02 → 03 → 04 → 13 → 14 → 15

路径 A 和 B/C 在 Plan 04 完成后可并行推进
路径 B 和 C 在 Plan 04 完成后可并行推进
Plan 16 在 Plan 04 完成后可随时开始
Plan 17 需所有其他计划基本完成后执行
```

---

## 三方库引入时序

| 引入阶段 | 新增依赖 |
|---------|---------|
| Plan 01 | **运行时**: vue, vue-router, pinia, vue-i18n, ant-design-vue, @ant-design/icons-vue, **ant-design-x-vue**, axios, dayjs, lodash-es |
| Plan 01 | **开发**: vite, @vitejs/plugin-vue, typescript, **@antfu/eslint-config**, eslint, **unocss**, @unocss/preset-wind, @unocss/preset-icons, husky, lint-staged, msw, unplugin-vue-components, unplugin-auto-import, vue-tsc |
| Plan 09 | @vue-office/docx, @vue-office/excel, @vue-office/pdf, vue-demi, marked |
| Plan 10 | @tiptap/vue-3, @tiptap/starter-kit, @tiptap/extension-placeholder, marked, dompurify |
| Plan 13 | highlight.js |
| Plan 16 | echarts, vue-echarts |

---

## 技术决策记录（ADR）

| 编号 | 决策 | 选择 | 替代方案 | 理由 |
|------|------|------|---------|------|
| ADR-001 | SSE 传输方式 | `fetch` + `ReadableStream` | `EventSource` | 需支持 POST + JWT Header |
| ADR-002 | ESLint 配置 | `@antfu/eslint-config` (flat config) | ESLint + Prettier | 更现代、配置更简洁、内置格式化无需 Prettier |
| ADR-003 | CSS 方案 | UnoCSS (原子化 CSS) + CSS 变量 | 纯 CSS 变量 / Tailwind | UnoCSS 更轻量、Vite 集成优秀、开发效率高 |
| ADR-004 | AI 对话组件 | Ant Design X Vue (ant-design-x-vue) | 手写全部对话组件 | 专为 AI 对话设计，与 Ant Design Vue 设计语言一致，减少 ~40% 对话组件开发量 |
| ADR-005 | 前后端联调 | MSW Mock 独立开发 | 直接联调后端 | 后端未就绪，前端需独立推进 |
