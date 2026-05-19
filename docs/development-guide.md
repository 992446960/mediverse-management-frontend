# 项目开发规范

本文档是 `mediverse-management-frontend` 的项目级开发规范。规则来自 `wang-convention`，但已按当前仓库真实技术栈裁剪；当通用模板与本项目实现冲突时，以本文档和现有代码为准。

## 1. 技术栈与基础约束

- 使用 Vue 3、TypeScript、Vite 7、Ant Design Vue 4、Ant Design X Vue、Pinia、Axios、MSW、Vitest。
- 使用 pnpm，版本以 `package.json` 的 `packageManager` 字段为准。
- 使用 `@` 指向 `src/`，不要新增长相对路径链。
- 代码风格以 `.prettierrc` 和 `eslint.config.js` 为准：无分号、单引号、`printWidth: 100`。
- 自动导入由 `vite.config.ts` 配置，覆盖 `vue`、`vue-router`、`pinia`；新增显式导入前先确认是否已自动导入。

## 2. 目录职责

| 目录 | 职责 |
| --- | --- |
| `src/api/` | 按业务模块封装接口，统一导入 `request` |
| `src/stores/` | Pinia setup store |
| `src/router/` | 路由定义、权限守卫、标题处理 |
| `src/config/` | 菜单、主题、错误码等配置 |
| `src/components/` | 通用组件和业务组件 |
| `src/composables/` | 可复用组合式逻辑 |
| `src/types/` | 跨模块 TypeScript 类型 |
| `src/mocks/` | MSW mock handlers 和数据 |
| `src/views/` | 页面级组件，按业务域分目录 |
| `tests/api-contract/` | 真实后端 API 合规性测试 |

## 3. Vue 与组件

- 页面和组件使用 Composition API 与 `<script setup>`。
- 组件名使用 PascalCase 目录或清晰业务名，入口组件优先使用 `index.vue`。
- Props 使用 TypeScript 类型定义；复杂事件 payload 必须有明确类型。
- 表单提交、保存、删除、上传等写操作必须有 loading 或禁用态，防止重复提交。
- 长文本必须处理溢出；表格、flex 容器和卡片内文本要避免撑爆布局。
- 组件只负责自身展示和交互，跨页面状态放到 store 或 composable。

## 4. API 层

- 所有普通 HTTP 请求必须通过 `src/api/index.ts` 的 `request` 发起。
- API 模块按业务拆分，例如 `auth.ts`、`knowledge.ts`、`sessions.ts`、`users.ts`。
- 后端响应按 `{ code, message, data }` 处理，默认成功码为 `code === 0`。
- 文件下载、SSE、技能执行等特殊请求可使用独立实现，但必须复用 token 获取逻辑。
- `Authorization: Bearer <token>` 由请求拦截器注入，不要在页面中重复拼接。
- 登录和刷新接口 401 不触发自动刷新；普通请求 401 会尝试刷新 token。
- 上传 `FormData` 时不要手写 `Content-Type`，由浏览器生成 boundary。

## 5. 状态管理

- Pinia 使用 setup store，状态用 `ref`，派生值用 `computed`，动作用普通函数。
- 登录 token 存取在 `src/utils/auth.ts`，用户信息和工作台开关在 `src/stores/auth.ts`。
- `auth` store 只持久化 `user`，token 和 refresh token 由工具函数单独管理。
- 清空登录态时必须同步清理标签页等会话状态，参考 `auth.logout()`。

## 6. 路由、菜单与权限

- 路由事实来源是 `src/router/routes.ts`，菜单事实来源是 `src/config/menu.ts`。
- 登录态校验和角色校验在 `src/router/guards.ts`。
- 角色权限使用 `meta.requiredRoles`，类型来自 `src/types/auth.ts`。
- 菜单过滤必须同时考虑 `requiredRoles` 和 `showWhenAvatar`。
- 新增页面时必须同步路由、菜单、i18n 文案和权限说明。

## 7. i18n 与文案

- 菜单、标题和通用业务文案应写入 `src/i18n/locales/zh-CN.ts` 和 `src/i18n/locales/en-US.ts`。
- `meta.title` 优先使用 i18n key，浏览器标题由路由守卫统一设置。
- 品牌名称使用 `app.brandName`，不要在页面中散落硬编码。

## 8. 样式

- 全局样式入口为 `src/styles/index.css`，变量在 `src/styles/variables.css`。
- 页面布局以 Tailwind 工具类为主，Ant Design Vue 深层样式使用 `:deep(.ant-*)`。
- 不要把一次性页面样式抽成全局样式；跨页面复用后再沉淀为组件或变量。
- PC 页面需要兼容窄屏浏览器访问，表格和复杂区域要允许横向滚动或自适应换行。

## 9. Mock 与测试

- MSW 由 `VITE_ENABLE_MOCK=true` 开启，入口在 `src/main.ts`。
- 新增接口 mock 时必须同步 `src/mocks/handlers.ts`、对应 handler 和 mock data。
- API 合规测试位于 `tests/api-contract/`，默认读取真实 API 配置。
- `tests/api-contract/API_CONTRACT_TEST_REPORT.md` 是最近一次合规测试报告，更新测试覆盖后应同步。

## 10. 文档与验证

- 修改代码、接口、配置、Docker 或需求后，必须更新 `docs/documentation-task-board.md`。
- 修改文档后必须运行 `pnpm check:docs`。
- 修改运行时代码或配置后必须运行 `pnpm verify`。
- Docker 配置变更必须运行 `docker compose config`。
- API 契约变更在具备 `.env.api-test` 和网络条件时运行 `pnpm test:api`。
