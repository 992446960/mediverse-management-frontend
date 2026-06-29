# mediverse-management-frontend

面向 Mediverse Management 管理端的前端项目，提供登录鉴权、组织/科室/用户管理、文件管理、知识卡管理、分身配置、知识库搜索和数字医生会话能力。

## 技术栈

| 类型 | 选型                                 |
| ---- | ------------------------------------ |
| 框架 | Vue 3 + TypeScript                   |
| 构建 | Vite 7                               |
| UI   | Ant Design Vue 4 + Ant Design X Vue  |
| 状态 | Pinia + pinia-plugin-persistedstate  |
| 请求 | Axios，统一封装在 `src/api/index.ts` |
| Mock | MSW，入口在 `src/mocks/browser.ts`   |
| 测试 | Vitest API contract tests            |
| 部署 | Docker 多阶段构建 + Nginx            |

## 快速启动

```bash
pnpm install
pnpm dev
```

开发服务默认由 Vite 启动，端口见 `vite.config.ts`。开发环境的 `/api` 代理默认指向线上 API；本机后端地址写入 `.env.development.local`，不要提交个人 IP。

```bash
DEV_PROXY_TARGET=http://127.0.0.1:8005
```

## 常用命令

| 命令                | 说明                                      |
| ------------------- | ----------------------------------------- |
| `pnpm dev`          | 启动 Vite 开发服务                        |
| `pnpm build`        | 类型检查并构建生产产物                    |
| `pnpm preview`      | 本地预览生产构建                          |
| `pnpm test:api`     | 运行 API 合规性测试                       |
| `pnpm check:theme`  | 检查 Vue 组件主题色守卫                   |
| `pnpm check:docs`   | 检查文档新鲜度                            |
| `pnpm verify`       | 执行主题守卫、文档检查和生产构建          |
| `pnpm docker:build` | 构建 Docker 镜像并导出 tar，可按参数上传到服务器 |

## Docker

Docker 打包、上传、服务器部署、API 上游覆盖、更新和回滚见 `README.Docker.md`。

本地预览生产镜像：

```bash
docker compose up --build
```

访问 `http://localhost:8080`，停止时执行：

```bash
docker compose down
```

## 开发原则

- 修改代码前先读对应模块实现和 `docs/development-guide.md`，不要按模板臆造结构。
- 任何影响代码、接口、配置、Docker 或需求的改动，都必须同步更新 `docs/documentation-task-board.md`。
- 提交前至少运行 `pnpm check:docs`；涉及运行时代码时运行 `pnpm verify`。
- 不要提交真实服务器地址、Token、账号密码或 `.env.api-test`。

## 文档索引

| 文档                   | 位置                                                                      | 说明                                                                               |
| ---------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Agent 指令             | `AGENTS.md`                                                               | AI Agent 操作边界、命令和验证要求                                                  |
| Claude 红线            | `CLAUDE.md`                                                               | Claude Code / Cursor 核心原则                                                      |
| 开发规范               | `docs/development-guide.md`                                               | 当前项目编码、架构、接口和测试规范                                                 |
| 开发文档               | `docs/frontend-development.md`                                            | 启动、环境变量、联调、验证流程                                                     |
| Docker 文档            | `README.Docker.md`                                                        | Docker 打包、部署、更新与回滚                                                      |
| API 设计               | `docs/API设计.docx`、`docs/API设计.md`                                    | Management、Ecosys、KnowledgeBase 域接口详细设计（md 为 docx 导出副本，便于 diff） |
| 文档任务看板           | `docs/documentation-task-board.md`                                        | 文档资产和新鲜度维护状态                                                           |
| 定制需求               | `docs/requirements/shanghai-first-hospital-customization-requirements.md` | 上海市第一人民医院定制需求                                                         |
| 分身与用户 UI 统一设计 | `docs/superpowers/specs/2026-05-29-avatar-user-ui-unification-design.md`  | 分身、用户、个人资料与工作台配置统一视觉规格                                       |
| 分身与用户 UI 统一计划 | `docs/superpowers/plans/2026-05-29-avatar-user-ui-unification.md`         | 可执行的组件拆分、页面改造、测试和验收计划                                         |
