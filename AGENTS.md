# 修改边界

- 必须先读现有实现，再修改代码；禁止顺手重构无关模块。
- 必须保护密钥和环境变量；禁止提交 `.env.api-test`、真实服务器地址、Token、账号密码。
- 必须保持 `README.md`、`AGENTS.md`、`CLAUDE.md`、`README.Docker.md`、`docs/**/*.md` 与代码同步。
- 修改代码、接口、Docker、环境变量或需求文档后，必须更新 `docs/documentation-task-board.md`。

# 命令

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 启动 Vite 开发服务 |
| `pnpm build` | 类型检查并构建 |
| `pnpm test:api` | 运行 API 合规性测试 |
| `pnpm check:docs` | 检查文档新鲜度 |
| `pnpm verify` | 文档检查 + 构建 |
| `docker compose config` | 校验 Docker Compose 配置 |
| `docker compose up --build` | 本地预览生产镜像 |

# 文件结构

- `src/api/` 按业务模块封装接口，统一使用 `src/api/index.ts` 的 `request`。
- `src/stores/` 使用 Pinia setup store，登录态在 `src/stores/auth.ts`。
- `src/router/` 维护路由和权限守卫，权限字段使用 `meta.requiredRoles`。
- `src/config/menu.ts` 维护侧边栏菜单，与路由权限保持一致。
- `src/views/` 维护页面入口；新增页面必须使用 `src/views/<domain>/<page>/index.vue`，页面私有组件放在同目录 `components/`。
- `src/components/` 只放跨页面复用的通用组件或明确复用的业务组件；禁止放置单页面专属组件。
- `src/mocks/` 维护 MSW 本地 mock，开启方式见 `.env.development`。
- `tests/api-contract/` 维护真实 API 合规性测试。
- `docs/` 存放开发规范、开发文档、任务看板和需求文档。

# 架构约束 / 编码规范

- 必须遵守 `docs/development-guide.md`，规范必须以当前项目真实代码为准。
- Vue 文件使用 Composition API 与 `<script setup>`；组件和 composable 必须保持职责单一。
- 新增或重构页面时必须先按页面目录、局部组件、局部 composable 拆分职责，禁止把大段页面逻辑继续堆进单个 `.vue` 文件。
- API 返回按 `{ code, message, data }` 处理；成功码默认 `code === 0`。
- 登录态 token 由 `src/utils/auth.ts` 管理，用户信息由 `src/stores/auth.ts` 管理。
- Docker 打包和部署以 `README.Docker.md` 为唯一权威文档。

# Git 提交

- 每个工作点完成后，必须先按 `docs/development-guide.md` 完成自审、验证和评估；通过后再提交并 push 当前工作点。
- 提交前必须检测当前跟踪远端是否可连接；远端通畅时默认 push，远端不通时停止提交和 push 并汇报原因。
- commit message 禁止携带第三方创作者、`Co-authored-by`、`Generated-by` 或代写署名信息。

# 验证要求

- 文档变更必须运行 `pnpm check:docs`。
- 代码或配置变更必须运行 `pnpm verify`。
- Docker 配置变更必须运行 `docker compose config`。
- API 契约变更在具备 `.env.api-test` 和网络条件时运行 `pnpm test:api`。
- 无法运行的验证必须在交付说明中写明原因。

# 文档索引

- 项目入口：`README.md`
- Claude 红线：`CLAUDE.md`
- 开发规范：`docs/development-guide.md`
- 开发文档：`docs/frontend-development.md`
- Docker 文档：`README.Docker.md`
- 文档任务看板：`docs/documentation-task-board.md`
- 定制需求：`docs/requirements/shanghai-first-hospital-customization-requirements.md`
