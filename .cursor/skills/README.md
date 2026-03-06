# Cursor Skills 使用文档

本文档描述两类技能：

1. **项目技能**：位于本项目 `.cursor/skills` 下，主要面向 Vue/前端与本仓库开发。
2. **用户目录技能**：位于用户主目录 `~/.cursor/skills`（及 `~/.agents/skills`、`~/.codex/skills` 等），以 **ecc-** 开头的全局技能为主，涵盖规划、审查、测试、安全、多语言与运维等。

便于在对话中按场景选用或提示 Agent 加载对应技能。

---

## 一、项目技能总览（`.cursor/skills`）

| 名称 | 作用简述 | 典型触发场景 |
|------|----------|--------------|
| [antfu](#1-antfu) | Anthony Fu 的 JS/TS 工具链与规范 | 新项目搭建、ESLint/Prettier、monorepo、库发布 |
| [find-skills](#2-find-skills) | 发现与安装开放技能生态中的技能 | “怎么做 X”“有没有 X 的技能” |
| [git-commit](#3-git-commit) | 按 Conventional Commits 规范生成并执行提交 | 提交代码、/commit、生成提交信息 |
| [nuxt](#4-nuxt) | Nuxt 全栈 Vue 框架（SSR、路由、数据获取） | Nuxt 应用、server routes、useFetch、中间件 |
| [pinia](#5-pinia) | Vue 官方状态管理库 | 定义 store、state/getters/actions、Pinia 模式 |
| [pnpm](#6-pnpm) | 包管理与 workspace 配置 | pnpm 命令、workspace、catalog、patch/override |
| [slidev](#7-slidev) | 基于 Markdown + Vue 的演示文稿 | 技术分享、会议演讲、教学幻灯片 |
| [tsdown](#8-tsdown) | 基于 Rolldown 的 TS/JS 库打包 | 打包库、生成 .d.ts、多格式、从 tsup 迁移 |
| [turborepo](#9-turborepo) | 前端 monorepo 构建与任务编排 | turbo.json、流水线、缓存、--filter/--affected |
| [unocss](#10-unocss) | 原子化 CSS 引擎（兼容 Tailwind 语法） | UnoCSS 配置、工具类、shortcuts、Wind/Icons |
| [vite](#11-vite) | 前端构建工具（含 Vite 8/Rolldown） | vite.config、插件、SSR、库模式 |
| [vitepress](#12-vitepress) | 基于 Vite + Vue 的静态站/文档站 | 文档站、主题、Markdown 中写 Vue |
| [vitest](#13-vitest) | 基于 Vite 的单元测试框架 | 写单测、mock、覆盖率、过滤与 fixture |
| [vue](#14-vue) | Vue 3 核心（Composition API、响应式） | .vue 组件、defineProps/defineEmits、生命周期 |
| [vue-best-practices](#15-vue-best-practices) | Vue 3 最佳实践与常见坑 | 任意 Vue 相关开发（强烈建议默认加载） |
| [vue-router-best-practices](#16-vue-router-best-practices) | Vue Router 4 路由与导航模式 | 路由守卫、params、路由-组件生命周期 |
| [vue-testing-best-practices](#17-vue-testing-best-practices) | Vue 测试实践（Vitest、E2E） | 组件测试、Vitest、Playwright E2E |
| [vueuse-functions](#18-vueuse-functions) | VueUse 组合式函数选型与用法 | Vue/Nuxt 中需复用逻辑时优先考虑 VueUse |
| [web-design-guidelines](#19-web-design-guidelines) | 对照 Web 界面规范做 UI 审查 | “审查 UI”“检查无障碍”“设计/UX 审计” |

---

## 二、项目技能说明（名称 / 作用 / 场景 / 举例）

### 1. antfu

- **名称**: antfu  
- **作用**: 提供 Anthony Fu 的 JavaScript/TypeScript 项目工具链与约定（代码组织、TypeScript、ESLint、Git Hooks、pnpm catalog 等）。  
- **使用场景**  
  - 新项目初始化（技术选型、目录结构）。  
  - 配置 ESLint/Prettier 替代方案（如 @antfu/eslint-config）。  
  - 搭建或维护 monorepo、库发布流程。  
  - 用户明确提到“Anthony Fu 的偏好”或“antfu 风格”时。  
- **举例**  
  - “用 antfu 的 ESLint 配置给这个 Vue 项目加规范。”  
  - “按 antfu 习惯整理这个 monorepo 的 pnpm catalog。”

---

### 2. find-skills

- **名称**: find-skills  
- **作用**: 帮助用户在开放技能生态中**发现并安装** Agent 技能（如通过 `npx skills find` / skills.sh）。  
- **使用场景**  
  - 用户问“怎么做 X”“有没有能做 X 的技能”。  
  - 用户想扩展 Agent 能力（设计、测试、部署等）。  
  - 需要搜索现成技能、模板或工作流。  
- **举例**  
  - “有没有专门做 PR review 的技能？”  
  - “帮我找一个做 React 性能优化的技能并安装。”

---

### 3. git-commit

- **名称**: git-commit  
- **作用**: 根据工作区/暂存区 diff 分析变更，生成符合 **Conventional Commits** 的提交信息，并执行 `git commit`（可配合智能暂存）。  
- **使用场景**  
  - 用户要求“提交代码”“写一个 commit”“/commit”。  
  - 需要自动推断 type/scope、生成简洁描述、可选 body/footer。  
- **举例**  
  - “帮我把当前改动按规范提交，并写上 Closes #123。”  
  - 用户输入 `/commit` 后，Agent 分析 diff 并执行提交。

---

### 4. nuxt

- **名称**: nuxt  
- **作用**: Nuxt 全栈 Vue 框架的用法与约定（SSR、文件路由、自动导入、useFetch、服务端路由、Nitro 部署等）。  
- **使用场景**  
  - 开发或修改 Nuxt 应用。  
  - 配置 server routes、middleware、useFetch/useAsyncData。  
  - 混合渲染、部署到 Vercel/Netlify/Cloudflare 等。  
- **举例**  
  - “在这个 Nuxt 项目里加一个 `/api/health` 的 server route。”  
  - “用 useFetch 拉取列表并做 SSR 缓存。”

---

### 5. pinia

- **名称**: pinia  
- **作用**: Vue 官方状态库 Pinia 的用法（store 定义、state/getters/actions、storeToRefs、插件、SSR、Nuxt 集成等）。  
- **使用场景**  
  - 定义或修改 Pinia store。  
  - 在组件外使用 store（路由守卫、插件）。  
  - 与 Nuxt、SSR、测试配合。  
- **举例**  
  - “用 Setup Store 写一个用户信息的 store，并支持 HMR。”  
  - “在路由守卫里根据 store 判断是否放行。”

---

### 6. pnpm

- **名称**: pnpm  
- **作用**: pnpm 包管理器的用法与最佳实践（CLI、workspace、catalog、overrides、patches、CI 等）。  
- **使用场景**  
  - 执行 pnpm 特有命令（install、add、workspace 过滤等）。  
  - 配置 `pnpm-workspace.yaml`、`.npmrc`、catalog。  
  - 处理依赖版本、patch、phantom 依赖、CI 冻结锁文件。  
- **举例**  
  - “用 pnpm catalog 统一管理所有 workspace 的 React 版本。”  
  - “在 CI 里用 `--frozen-lockfile` 跑 install。”

---

### 7. slidev

- **名称**: slidev  
- **作用**: 用 Markdown + Vue 组件制作和演示幻灯片（代码高亮、动画、导出 PDF/PPTX、演讲者备注等）。  
- **使用场景**  
  - 做技术分享、会议演讲、教学材料。  
  - 需要代码片段、Mermaid/LaTeX、Monaco 可编辑、录制演示。  
- **举例**  
  - “用 slidev 新建一个主题为 default 的演讲，第一页标题是‘Vue 3 响应式原理’。”  
  - “给这段代码块加逐行点击高亮并导出 PDF。”

---

### 8. tsdown

- **名称**: tsdown  
- **作用**: 使用 Rolldown 打包 TypeScript/JavaScript 库，生成多格式与 .d.ts，支持从 tsup 迁移。  
- **使用场景**  
  - 开发要发 npm 的 TS/JS 库。  
  - 需要 ESM/CJS/IIFE/UMD、tree-shaking、minify。  
  - 从 tsup 迁移或做 React/Vue 组件库构建。  
- **举例**  
  - “用 tsdown 给这个包配置 ESM+CJS 双格式和 dts。”  
  - “按 tsdown 文档把现有 tsup 配置迁移过去。”

---

### 9. turborepo

- **名称**: turborepo  
- **作用**: 前端 monorepo 的构建与任务编排（任务管道、依赖图、本地/远程缓存、--filter/--affected）。  
- **使用场景**  
  - 配置或修改 `turbo.json`、任务与 `dependsOn`。  
  - 在 apps/packages 之间共享代码、只跑变更包。  
  - 调试缓存、CI 优化、环境变量与边界。  
- **举例**  
  - “给 turbo 加一个 lint 任务，并保证先 build 再 test。”  
  - “只对这次改动的 package 跑 build：`turbo run build --filter=...[main]`。”

---

### 10. unocss

- **名称**: unocss  
- **作用**: UnoCSS 原子化 CSS 的配置与写法（规则、shortcuts、主题、变体、Wind/Icons/Attributify 等）。  
- **使用场景**  
  - 配置 `uno.config.*` / `unocss.config.*`、preset。  
  - 写工具类、shortcuts、自定义 rule。  
  - 使用 Wind、Icons、Attributify 等预设。  
- **举例**  
  - “项目里已经用了 preset wind，帮我用 UnoCSS 写这个卡片的响应式布局。”  
  - “加一个 shortcut：`flex-center` 表示 flex 且居中。”

---

### 11. vite

- **名称**: vite  
- **作用**: Vite 构建工具配置与用法（含 Vite 8 Rolldown、插件、SSR、库模式、环境变量等）。  
- **使用场景**  
  - 编写或修改 `vite.config.ts`、插件。  
  - 配置别名、代理、SSR、库构建。  
  - 使用 `import.meta.glob`、资源查询、HMR API。  
- **举例**  
  - “在 vite 里把 `@` 指到 `src`，并给 `/api` 配个开发代理。”  
  - “用 Vite 库模式打一个 Vue 组件库。”

---

### 12. vitepress

- **名称**: vitepress  
- **作用**: 基于 Vite + Vue 的静态站/文档站（Markdown 路由、主题、Vue 组件、搜索、多语言等）。  
- **使用场景**  
  - 搭建或维护文档站、博客、产品站。  
  - 配置 `.vitepress/config.ts`、主题、导航/侧栏。  
  - 在 Markdown 里使用 Vue 组件或自定义容器。  
- **举例**  
  - “用 VitePress 建一个文档站，左侧栏从目录自动生成。”  
  - “在文档里加一个自定义的‘注意’块样式。”

---

### 13. vitest

- **名称**: vitest  
- **作用**: 基于 Vite 的单元测试框架（Jest 兼容 API、mock、快照、覆盖率、过滤、多线程等）。  
- **使用场景**  
  - 写或改单元测试、配置 Vitest。  
  - Mock、vi 工具、快照、覆盖率报告。  
  - 按文件名/标签过滤、并发与分片。  
- **举例**  
  - “用 Vitest 给这个 composable 写测试，并 mock 掉 axios。”  
  - “只跑包含 @integration 的测试并生成覆盖率。”

---

### 14. vue

- **名称**: vue  
- **作用**: Vue 3 核心（Composition API、`<script setup>`、响应式、生命周期、内置组件与指令）。  
- **使用场景**  
  - 写或改 .vue 单文件组件。  
  - 使用 defineProps/defineEmits/defineModel、ref/computed/watch。  
  - 使用 Transition、Teleport、Suspense、KeepAlive 等。  
- **举例**  
  - “用 script setup 写一个带 props 和 emit 的按钮组件。”  
  - “用 watchEffect 在窗口 resize 时更新一个 ref。”

---

### 15. vue-best-practices

- **名称**: vue-best-practices  
- **作用**: Vue 3 最佳实践与常见坑（响应式、computed、watch、组件、Props/Emits、模板、表单、生命周期等），**建议所有 Vue 相关任务默认加载**。  
- **使用场景**  
  - 任意涉及 .vue、Vue Router、Pinia 或 Vite+Vue 的开发。  
  - 避免 ref/reactive 误用、computed 副作用、v-if 与 v-for 混用等问题。  
- **举例**  
  - “为什么这个 computed 不更新？帮我按最佳实践改一下。”  
  - “列表用 v-for 时要 key，并避免和 v-if 写在同一元素上。”

---

### 16. vue-router-best-practices

- **名称**: vue-router-best-practices  
- **作用**: Vue Router 4 的路由与导航模式（守卫、params、与组件生命周期的配合）。  
- **使用场景**  
  - 使用 beforeRouteEnter、全局/路由独享守卫。  
  - 同一路由不同 params 的刷新、重定向循环。  
  - 路由与组件的挂载/卸载、清理逻辑。  
- **举例**  
  - “在进入详情页前用守卫请求权限，再决定是否跳转。”  
  - “从 /user/1 到 /user/2 时组件不重新创建，如何根据 params 重新请求？”

---

### 17. vue-testing-best-practices

- **名称**: vue-testing-best-practices  
- **作用**: Vue 测试实践（Vitest、Vue Test Utils、组件测试、mock、E2E 用 Playwright）。  
- **使用场景**  
  - 为 Vue 项目配置或编写单元/组件测试。  
  - 测试中有 Pinia、Teleport、Suspense、异步组件等。  
  - 选型或编写 E2E（推荐 Playwright）。  
- **举例**  
  - “用 Vitest + Vue Test Utils 测这个带 Pinia 的页面，并 mock 掉 store。”  
  - “弹窗用了 Teleport，测试里怎么正确找到并断言？”

---

### 18. vueuse-functions

- **名称**: vueuse-functions  
- **作用**: 在 Vue/Nuxt 中优先选用 **VueUse** 组合式函数实现需求，减少手写、提升可维护性。  
- **使用场景**  
  - 需要本地/会话存储、剪贴板、全屏、媒体查询、窗口尺寸、拖拽等。  
  - 需要响应式的浏览器 API 封装（如 IntersectionObserver、ResizeObserver）。  
- **举例**  
  - “用 VueUse 做一个响应式的 localStorage 主题字段，并和 useDark 联动。”  
  - “需要‘元素进入视口再加载’：优先查 VueUse 里有没有 useIntersectionObserver。”

---

### 19. web-design-guidelines

- **名称**: web-design-guidelines  
- **作用**: 根据 Vercel Web Interface Guidelines 对指定文件做 **UI/无障碍/设计** 审查，输出规则符合性结果。  
- **使用场景**  
  - 用户要求“审查 UI”“检查无障碍”“设计/UX 审计”“对照最佳实践检查页面”。  
- **举例**  
  - “用 web 规范审查 `src/views/Home.vue` 和 `src/components/Button.vue`。”  
  - “检查这个站点是否满足 Web Interface Guidelines。”

---

## 三、用户目录下的 Skills（全局 / ECC）

这些技能安装在**用户主目录**下，对所有项目生效，常见路径：

- `~/.cursor/skills/`（Cursor 加载）
- `~/.agents/skills/`（部分 Agent 运行时）
- `~/.codex/skills/`（Codex 等）

以下以 **ecc-** 系列为主，按类别列出（基于 `~/.cursor/skills` 常见配置，实际可用技能因本机安装而异）。与项目技能一样，可在对话中通过“用 ecc-plan 做实现计划”等方式显式引用。

### 3.1 用户目录技能总览（按类别）

| 类别 | 技能名 | 作用简述 | 典型触发场景 |
|------|--------|----------|--------------|
| **规划与流程** | ecc-plan | 复杂需求/架构的实现规划，先出步骤再等确认 | 新功能启动、大重构、需求不清时 |
| | ecc-multi-plan | 多模型协作规划（上下文 + 双模型分析 → 步骤计划） | 需要多角度拆解实现时 |
| | ecc-orchestrate | 复杂任务顺序式 Agent 工作流 | 多步骤、多依赖的复杂任务 |
| | ecc-multi-workflow | 多模型协作流程（研究→构思→计划→执行→优化→审查） | 前后端/全栈协作开发 |
| | ecc-multi-backend | 后端导向流程（Codex 主导） | 后端架构、API、数据库设计 |
| | ecc-multi-frontend | 前端导向流程（Gemini 主导） | 前端架构、React/Next 等 |
| | ecc-multi-execute | 多模型协作执行（计划→实现→审计） | 按计划落地并做多模型审计 |
| **代码质量与审查** | ecc-code-review | 代码质量与安全审查（安全/性能/规范） | 改完代码、提交前、Review 时 |
| | ecc-coding-standards | 编码规范、质量、安全、测试、Git 流程 | 写/改/审/计划/提交任何代码时 |
| | ecc-ctx-review | 模式：PR 审查、代码分析 | 需要专注“审查”上下文时 |
| | ecc-ctx-dev | 模式：主动开发 | 需要专注“开发”上下文时 |
| | ecc-ctx-research | 模式：探索、调研、学习 | 需要专注“调研”上下文时 |
| **安全** | ecc-security-review | 认证、输入、密钥、API、支付等安全清单与模式 | 做登录、API、敏感功能时 |
| | ecc-security-scan | 扫描 .claude/ 等配置的安全与注入风险 | 检查 Agent/Claude 配置安全时 |
| | ecc-django-security | Django 安全实践（认证、CSRF、SQL/XSS 等） | Django 项目安全加固 |
| | ecc-springboot-security | Spring Security 实践（认证、限流、依赖等） | Spring Boot 安全加固 |
| **测试** | ecc-tdd | TDD 流程：先接口→失败测试→实现→重构 | 新功能、修 bug、希望先写测试时 |
| | ecc-tdd-workflow | TDD + 80%+ 覆盖率（单测/集成/E2E） | 严格 TDD 与覆盖率要求时 |
| | ecc-test-coverage | 分析覆盖率、补缺失测试达 80%+ | 补测、提升覆盖率时 |
| | ecc-e2e | 为关键流程生成 Playwright E2E 测试 | 需要 E2E 用例时 |
| | ecc-e2e-testing | Playwright E2E 模式、POM、CI、稳定性 | 配置/维护 E2E 时 |
| | ecc-python-testing | pytest、TDD、mock、覆盖率 | Python 测试 |
| | ecc-django-tdd | Django/pytest-django、factory_boy、DRF 测试 | Django 项目 TDD |
| | ecc-springboot-tdd | JUnit 5、Mockito、Testcontainers、JaCoCo | Spring Boot 项目 TDD |
| | ecc-golang-testing | Go 表驱动、子测试、bench、fuzz | Go 测试 |
| | ecc-go-test | Go TDD 工作流 | Go 功能开发时先写测试 |
| | ecc-cpp-testing | GoogleTest/CTest、失败/不稳定测试诊断 | C++ 测试编写与排查 |
| **构建与修复** | ecc-build-fix | 修复构建与编译错误 | 构建失败、编译器报错时 |
| | ecc-go-build | 修复 Go 构建与模块问题 | Go 构建失败时 |
| **后端 / API** | ecc-api-design | REST API 设计（资源命名、状态码、分页、限流等） | 设计或评审生产级 API 时 |
| | ecc-backend-patterns | Node/Express/Next API 后端架构与最佳实践 | 后端服务设计时 |
| | ecc-django-patterns | Django 架构、DRF、ORM、缓存、生产级应用 | Django 后端开发 |
| | ecc-springboot-patterns | Spring Boot 架构、REST、分层、缓存、日志 | Spring Boot 后端开发 |
| **前端** | ecc-frontend-patterns | React/Next.js、状态、性能、UI 实践 | 前端架构与实现时 |
| **数据库** | ecc-database-migrations | 迁移最佳实践（schema、回滚、零停机） | 设计/执行 DB 迁移时 |
| | ecc-postgres-patterns | PostgreSQL 查询优化、schema、索引、安全（Supabase） | Postgres 设计与优化时 |
| | ecc-jpa-patterns | JPA/Hibernate 实体、关系、事务、分页 | Spring Boot 数据层时 |
| | ecc-clickhouse-io | ClickHouse 查询、分析、数据工程 | 分析型存储与查询时 |
| **运维 / 部署** | ecc-deployment-patterns | 部署流程、CI/CD、Docker、健康检查、回滚 | 上线与发布流程时 |
| | ecc-docker-patterns | Docker/Compose、安全、网络、卷、多服务 | 容器化与本地/生产环境时 |
| | ecc-pm2 | 根据项目生成 PM2 服务命令 | 需用 PM2 管理进程时 |
| **语言与框架规范** | ecc-typescript | TypeScript 编码规范与最佳实践 | 写/审 TS/JS 时 |
| | ecc-python | Python 编码规范与最佳实践 | 写/审 Python 时 |
| | ecc-python-patterns | Pythonic、PEP 8、类型提示、可维护性 | Python 项目规范时 |
| | ecc-python-review | Python 代码审查（PEP 8、类型、安全），可调 python-reviewer | 需要正式 Python 审查时 |
| | ecc-golang | Go 编码规范与最佳实践 | 写/审 Go 时 |
| | ecc-golang-patterns | Go 惯用模式与可维护实践 | Go 项目规范时 |
| | ecc-go-review | Go 代码审查（惯用法、最佳实践） | 审查 Go 代码时 |
| | ecc-java-coding-standards | Java 规范（命名、不可变、Optional、异常等） | Spring/Java 项目时 |
| | ecc-cpp-coding-standards | C++ Core Guidelines，现代、安全、惯用 | 写/审/重构 C++ 时 |
| | ecc-swift | Swift 编码规范与最佳实践 | 写/审 Swift 时 |
| | ecc-swiftui-patterns | SwiftUI 架构、@Observable、导航、性能 | iOS/macOS UI 开发时 |
| | ecc-swift-actor-persistence | Actor 持久化（内存缓存 + 文件） | Swift 并发与持久化时 |
| | ecc-swift-protocol-di-testing | 协议注入与 Swift Testing 可测设计 | Swift 可测试性时 |
| | ecc-swift-concurrency-6-2 | Swift 6.2 并发（@concurrent、isolated） | Swift 并发模型时 |
| | ecc-liquid-glass-design | iOS 26 Liquid Glass 设计系统 | SwiftUI/UIKit 玻璃态 UI 时 |
| | ecc-foundation-models-on-device | Apple 端侧 LLM（FoundationModels） | iOS 26+ 设备上模型时 |
| **文档与架构** | ecc-update-docs | 文档与代码同步，从源码生成文档 | 文档滞后或需从代码生成时 |
| | ecc-update-codemaps | 代码库结构与架构文档（精简 token） | 需要架构/代码地图时 |
| | ecc-project-guidelines-example | 项目级技能/规范模板示例 | 编写项目专属技能时 |
| **重构与清理** | ecc-refactor-clean | 死代码删除与简化 | 删未使用代码、简化模块时 |
| **研究 / 成本 / 其他** | ecc-search-first | 先搜索再编码（现有工具/库/模式） | 避免重复造轮子时 |
| | ecc-cost-aware-llm-pipeline | LLM 调用成本优化（路由、预算、重试、缓存） | 多模型/API 成本敏感时 |
| | ecc-content-hash-cache-pattern | 基于内容哈希的缓存（SHA-256、失效） | 昂贵文件处理结果缓存时 |
| | ecc-regex-vs-llm-structured-text | 选型：正则 vs LLM 解析结构化文本 | 解析规则文本时的方案选择 |
| | ecc-nutrient-document-processing | Nutrient DWS：PDF/Office 处理、OCR、签署等 | 文档处理与签署流程时 |
| | ecc-eval | 基于 eval 的开发工作流 | 做评估驱动开发时 |
| | ecc-learn-eval | 从会话提炼可复用模式并保存（Global/Project） | 沉淀经验为技能时 |
| | ecc-sessions | Claude Code 会话历史（列表、加载、别名、编辑） | 管理 ~/.claude/sessions 时 |
| | ecc-skill-stocktake | 技能与命令质量审计（Quick/Full） | 审计技能与命令时 |
| | ecc-claw | 启动 NanoClaw Agent REPL（claude CLI） | 需要持久会话的 CLI Agent 时 |
| | ecc-visa-doc-translate | 签证材料图片译英并生成中英对照 PDF | 签证文档翻译与排版时 |
| | ecc-django-verification | Django 发布前验证（迁移、lint、测试、安全） | Django 上线/PR 前检查 |
| | ecc-springboot-verification | Spring Boot 发布前验证（构建、测试、安全、diff） | Spring Boot 上线/PR 前检查 |

### 3.2 用户目录技能详解（部分）

以下为常用用户目录技能的「名称 / 作用 / 使用场景 / 举例」，与项目技能格式一致。

#### ecc-plan

- **名称**: ecc-plan  
- **作用**: 在写代码前做**实现规划**：澄清需求、识别风险、拆成步骤、**等待用户确认**后再执行。  
- **使用场景**  
  - 启动新功能、做大重构、多文件/多模块改动。  
  - 需求模糊或有多解时，先出方案再动手。  
- **举例**  
  - “用 ecc-plan 给「市场结算时实时通知用户」做实现计划。”  
  - “/ecc-plan 我要加一个多通道（站内/邮件/Webhook）的结算通知，先给我分阶段方案。”

#### ecc-code-review

- **名称**: ecc-code-review  
- **作用**: 对未提交变更做**质量与安全审查**（密钥、注入、XSS、大函数、嵌套、错误处理、a11y 等），按严重程度输出并可在存在 CRITICAL/HIGH 时阻止提交。  
- **使用场景**  
  - 写完或改完代码、提交前、做 PR Review 时。  
- **举例**  
  - “用 ecc-code-review 看下我这次改动的安全和规范问题。”  
  - “提交前先跑一遍 code review，有高危就别提交。”

#### ecc-tdd

- **名称**: ecc-tdd  
- **作用**: 强制 **TDD 流程**：先定接口 → 写失败测试（RED）→ 最小实现通过（GREEN）→ 重构并保持通过（REFACTOR），并可配合覆盖率要求。  
- **使用场景**  
  - 新功能、修 bug（先写复现测试）、重构、关键业务逻辑。  
- **举例**  
  - “用 ecc-tdd 给这个定价函数加逻辑，先写测试再实现。”  
  - “用 TDD 修这个 bug：先写一个会失败的测试再改代码。”

#### ecc-security-review

- **名称**: ecc-security-review  
- **作用**: 在涉及认证、用户输入、密钥、API、支付等场景时，提供**安全清单与模式**（密钥管理、输入校验、依赖安全等），避免常见漏洞。  
- **使用场景**  
  - 做登录/鉴权、处理用户输入或上传、新增 API、接入支付或敏感数据时。  
- **举例**  
  - “我们要加一个邮箱+密码登录，用 ecc-security-review 过一遍安全点。”  
  - “这个接口会接收用户上传文件，按 security review 检查一下风险。”

#### ecc-build-fix

- **名称**: ecc-build-fix  
- **作用**: 专门**修复构建与编译错误**（含依赖、配置、语法等），在构建失败或编译器报错时使用。  
- **使用场景**  
  - `pnpm build` / `npm run build` 失败、TypeScript/ESLint 报错、依赖冲突导致无法构建时。  
- **举例**  
  - “构建报错：xxx，用 ecc-build-fix 帮我修到能通过。”  
  - “tsc 报 3 个类型错误，按 build-fix 流程一起修掉。”

---

## 四、可选的文档补充建议（项目 + 用户技能通用）

以下内容可根据需要决定是否在后续版本中补充：

1. **触发词/别名表**  
   - 为每个技能列一列“用户怎么说时会触发”（如 git-commit 的“提交”“/commit”），方便检索和优化 Agent 的 skill 选择逻辑。

2. **版本与兼容性**  
   - 在总览或各技能下注明主要依赖版本（如 Vue 3.x、Vite 8、Nuxt 3、Vitest 3），避免与旧项目混用导致建议不符。

3. **技能组合建议**  
   - 例如：“写 Vue 页面时建议同时加载 vue + vue-best-practices + vueuse-functions”；“Nuxt 项目建议 nuxt + pinia + vue-best-practices”。

4. **与 AGENTS.md / Rules 的配合**  
   - 简短说明如何在 `AGENTS.md` 或 Cursor Rules 里写“默认加载某技能”或“涉及 Vue 时必读 vue-best-practices”，便于团队统一。

5. **更新与来源**  
   - 每个技能的 frontmatter 里已有 version/source 的，可在 README 里加一列“文档版本/来源”，方便判断是否要更新技能包。

如需，我可以按上述任一条目直接改一版 README 或单独加一个小节（例如“触发词与推荐组合”）。

---

## 五、文档维护

- 路径：`.cursor/skills/README.md`  
- **项目技能**：新增或删除本项目 `.cursor/skills` 下技能时，请同步更新「一、项目技能总览」与「二、项目技能说明」。  
- **用户目录技能**：若 `~/.cursor/skills` 等处的 ecc-* 或其它全局技能有增删或职责变更，建议同步更新「三、用户目录下的 Skills」中的总览表与详解。  
- 若某技能的 SKILL.md 有重大变更（名称、用途、触发场景），建议一并更新本 README 对应条目。
