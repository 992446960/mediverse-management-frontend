# Plan 01: 项目脚手架与工程配置

> 来源阶段：Phase 1（任务 1.1、1.2、1.12）  
> 前置依赖：无  
> 项目目录：`mediverse-management-frontend/`

---

## 一、设计文档

> 参考以下初始设计文档的对应章节：

| 文档 | 路径 | 参考章节 |
|------|------|---------|
| 技术设计 | `doc/初始文档/技术设计.md` | 1.2 技术选型（前端部分） |
| 前端模块设计 | `doc/初始文档/前端模块设计.md` | 目录结构规范 |
| 前端架构与阶段规划 | `doc/前端开发文档/前端开发架构与阶段规划.md` | 三.1 项目脚手架初始化 |
| 前端实施指南 | `doc/前端开发文档/前端开发实施指南.md` | 二.1 目录结构 |

### 关键设计要点

- 使用 Vite 5.x 创建 Vue 3 + TypeScript 项目
- 包管理器使用 pnpm
- 代码规范使用 **@antfu/eslint-config**（flat config，内置格式化，无需 Prettier）
- CSS 方案使用 **UnoCSS**（原子化 CSS）+ CSS 变量（主题 token）
- AI 对话组件使用 **Ant Design X Vue**（ant-design-x-vue）
- 引入 MSW 作为 Mock 数据层，开发环境自动启用（后端未就绪，前端独立开发）
- 按规范创建 `src/` 下全部子目录结构
- 配置多环境变量文件（development / staging / production）

---

## 二、参与的智能体与 Skills

| 角色 | 智能体/Skill | 职责 |
|------|-------------|------|
| 执行 | `frontend-developer` | 创建项目、安装依赖、配置工具链 |
| 参考 | Skill: `vue-best-practices` | Vue 3 Composition API 规范 |
| 参考 | Skill: `vite` | Vite 配置与插件 |
| 参考 | Skill: `pnpm` | pnpm 工作区与依赖管理 |
| 参考 | Skill: `antfu` | @antfu/eslint-config 配置 |
| 参考 | Skill: `unocss` | UnoCSS 配置与预设 |

---

## 三、计划内容

### 3.1 任务清单

| 编号 | 任务 | 描述 | 涉及文件/目录 |
|------|------|------|--------------|
| 01-1 | 初始化 Vite 项目 | `pnpm create vite mediverse-management-frontend --template vue-ts` | 项目根目录 |
| 01-2 | 安装核心运行时依赖 | vue-router、pinia、ant-design-vue、@ant-design/icons-vue、ant-design-x-vue、vue-i18n、axios、dayjs、lodash-es | `package.json` |
| 01-3 | 安装开发依赖 | @antfu/eslint-config、husky、lint-staged、msw、unplugin-vue-components、unplugin-auto-import、unocss、vue-tsc | `package.json` |
| 01-4 | 配置 Vite | 路径别名（`@` → `src/`）、服务器代理、自动导入插件、UnoCSS 插件 | `vite.config.ts` |
| 01-5 | 配置 TypeScript | 严格模式、路径映射、Vue 类型引用 | `tsconfig.json`、`tsconfig.app.json`、`tsconfig.node.json` |
| 01-6 | 配置 ESLint（@antfu） | flat config，Vue 3 + TypeScript 规则集，内置格式化（无需 Prettier） | `eslint.config.ts` |
| 01-7 | 配置 UnoCSS | presetWind（Tailwind 兼容）、presetIcons（图标）、自定义 shortcuts | `uno.config.ts` |
| 01-8 | 配置 Git Hooks | husky pre-commit → lint-staged | `.husky/pre-commit`、`.lintstagedrc` |
| 01-9 | 创建目录结构 | 按规范创建 src/ 下全部子目录 | `src/**` |
| 01-10 | 配置环境变量 | 三套环境文件 + 类型声明 | `.env.development`、`.env.staging`、`.env.production`、`src/env.d.ts` |
| 01-11 | 创建入口文件 | main.ts 基础启动逻辑（含 MSW 条件启用） | `src/main.ts` |
| 01-12 | 配置 MSW 基础框架 | 创建 mocks 目录结构 + browser worker 注册（后端未就绪，Mock 为主要数据来源） | `src/mocks/`、`public/mockServiceWorker.js` |

### 3.2 目录结构规范

```
mediverse-management-frontend/
├── public/
│   └── mockServiceWorker.js    # MSW Service Worker
├── src/
│   ├── api/                    # API 请求方法
│   ├── assets/                 # 静态资源（图片/SVG）
│   ├── components/             # 通用业务组件
│   ├── composables/            # Composable 函数
│   ├── config/                 # 常量/菜单/主题配置
│   ├── directives/             # 自定义指令
│   ├── i18n/                   # 国际化
│   │   └── locales/
│   │       ├── zh-CN.ts
│   │       └── en-US.ts
│   ├── layouts/                # 布局组件
│   ├── mocks/                  # MSW Mock 数据
│   │   ├── browser.ts
│   │   ├── handlers/
│   │   ├── data/
│   │   └── utils.ts
│   ├── router/                 # 路由配置
│   ├── stores/                 # Pinia Store
│   ├── styles/                 # 全局样式
│   ├── types/                  # TypeScript 类型定义
│   ├── utils/                  # 工具函数
│   ├── views/                  # 页面组件
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── my/
│   │   ├── dept/
│   │   ├── org/
│   │   ├── chat/
│   │   ├── knowledge-base/
│   │   └── error/
│   ├── App.vue
│   ├── main.ts
│   └── env.d.ts
├── .env.development
├── .env.staging
├── .env.production
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

### 3.3 核心依赖清单

#### 运行时依赖（Plan 01 安装）

| 包名 | 用途 |
|------|------|
| `vue` | 前端框架 |
| `vue-router` | 路由管理 |
| `pinia` | 状态管理 |
| `vue-i18n` | 国际化 |
| `ant-design-vue` | 企业级 UI 组件库 |
| `@ant-design/icons-vue` | 图标库 |
| `ant-design-x-vue` | AI 对话场景组件（Bubble/Conversations/Sender/ThoughtChain） |
| `axios` | HTTP 请求 |
| `dayjs` | 日期处理 |
| `lodash-es` | 工具函数 |

#### 开发依赖（Plan 01 安装）

| 包名 | 用途 |
|------|------|
| `vite` | 构建工具 |
| `@vitejs/plugin-vue` | Vite Vue 插件 |
| `typescript` | 类型系统 |
| `vue-tsc` | Vue SFC 类型检查 |
| `@antfu/eslint-config` | ESLint flat config（含格式化，无需 Prettier） |
| `eslint` | ESLint 引擎 |
| `unocss` | 原子化 CSS 引擎 |
| `@unocss/preset-wind` | Tailwind 兼容预设 |
| `@unocss/preset-icons` | 图标预设（可选，补充 @ant-design/icons-vue） |
| `husky` | Git Hooks |
| `lint-staged` | 暂存区检查 |
| `msw` | Mock Service Worker（后端未就绪，核心依赖） |
| `unplugin-vue-components` | 组件自动导入 |
| `unplugin-auto-import` | API 自动导入 |
| `@types/lodash-es` | lodash-es 类型 |

#### 后续阶段按需引入

| 包名 | 用途 | 引入计划 |
|------|------|---------|
| `@vue-office/*`、`marked` | 文件预览（PDF/docx/xlsx/md） | Plan 09 |
| `marked` | Markdown 渲染 | Plan 10 |
| `dompurify` + `@types/dompurify` | HTML 净化 | Plan 10 |
| `@tiptap/vue-3` + `@tiptap/starter-kit` | 富文本编辑 | Plan 10 |
| `highlight.js` | 代码高亮（对话 Markdown 渲染） | Plan 13 |
| `echarts` + `vue-echarts` | 图表可视化 | Plan 16 |

### 3.4 Vite 配置要点

```typescript
// vite.config.ts 关键配置项
import UnoCSS from 'unocss/vite'

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    Components({ resolvers: [AntDesignVueResolver()] }),
    AutoImport({ imports: ['vue', 'vue-router', 'pinia'] }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
```

### 3.5 UnoCSS 配置要点

```typescript
// uno.config.ts
import { defineConfig, presetWind, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetWind(),   // Tailwind CSS 兼容
    presetIcons(),  // 图标预设
  ],
  shortcuts: {
    // 可在此定义项目级快捷类名
  },
  theme: {
    colors: {
      primary: '#0ea5e9',  /* 与 variables.css 主色一致（Sky Blue） */
    },
  },
})
```

### 3.6 ESLint 配置（@antfu/eslint-config）

```typescript
// eslint.config.ts
import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  typescript: true,
  unocss: true,
  formatters: true,  // 内置格式化，无需 Prettier
})
```

### 3.7 环境变量定义

```bash
# .env.development
VITE_API_BASE_URL=/api/v1
VITE_APP_TITLE=Mediverse Management (Dev)
VITE_ENABLE_MOCK=true

# .env.staging
VITE_API_BASE_URL=https://staging-api.mediverse.com/api/v1
VITE_APP_TITLE=Mediverse Management (Staging)
VITE_ENABLE_MOCK=false

# .env.production
VITE_API_BASE_URL=https://api.mediverse.com/api/v1
VITE_APP_TITLE=Mediverse Management
VITE_ENABLE_MOCK=false
```

---

## 四、验收效果

- [ ] 项目目录 `mediverse-management-frontend/` 已创建
- [ ] `pnpm install` 成功安装所有依赖
- [ ] `pnpm dev` 可正常启动开发服务器，浏览器可访问
- [ ] `pnpm build` 无 TypeScript 编译错误
- [ ] `pnpm lint` 无 ESLint 报错（@antfu/eslint-config flat config）
- [ ] Git commit 时 husky + lint-staged 钩子正常触发
- [ ] UnoCSS 原子化类名在 `.vue` 文件中可正常生效
- [ ] `src/` 下全部子目录已按规范创建
- [ ] `.env.development` / `.env.staging` / `.env.production` 三个环境文件存在
- [ ] `@` 路径别名在 `.ts` 和 `.vue` 文件中可正常解析
- [ ] MSW 在开发环境启动时控制台输出 `[MSW] Mocking enabled`
- [ ] `unplugin-vue-components` 自动导入 Ant Design Vue 组件生效
