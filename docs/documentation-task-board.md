# 文档任务看板

本文档记录项目文档资产、事实来源和新鲜度状态。任何代码、接口、配置、Docker 或需求变更，都必须更新对应条目。

## 文档资产

| 文档 | 事实来源 | 状态 | 维护要求 |
| --- | --- | --- | --- |
| `README.md` | `package.json`、`vite.config.ts`、`README.Docker.md`、`docs/` | 已补全 | 项目定位、命令和文档索引变化时更新 |
| `AGENTS.md` | `project-init`、当前仓库结构、验证命令 | 已补全 | Agent 操作边界、命令或文档索引变化时更新 |
| `CLAUDE.md` | `project-init`、项目红线规则 | 已补全 | 核心红线变化时更新，保持 20 行以内 |
| `docs/development-guide.md` | `wang-convention`、`src/`、`tests/` | 已补全 | 编码规范、架构约束或模块边界变化时更新 |
| `docs/frontend-development.md` | `package.json`、`.env.*`、`vite.config.ts`、Docker 配置 | 已补全 | 启动、联调、验证、环境变量变化时更新 |
| `README.Docker.md` | `Dockerfile`、`compose.yaml`、`nginx.conf`、`scripts/docker-*.sh` | 已补全 | Docker 打包、部署、变量、回滚流程变化时更新 |
| `docs/requirements/shanghai-first-hospital-customization-requirements.md` | 定制需求和 `docs/requirements/assets/` | 已存在 | 需求范围、素材或验收标准变化时更新 |
| `tests/api-contract/API_CONTRACT_TEST_REPORT.md` | `tests/api-contract/`、真实 API 测试结果 | 已存在 | API 合规测试覆盖或结果变化时更新 |

## 检查任务

| 任务 | 命令 | 状态 |
| --- | --- | --- |
| 文档新鲜度检查 | `pnpm check:docs` | 必须通过 |
| 聚合验证 | `pnpm verify` | 代码或配置变更时必须通过 |
| Docker Compose 校验 | `docker compose config` | Docker 相关变更时必须通过 |
| API 合规测试 | `pnpm test:api` | 具备 `.env.api-test` 和网络条件时运行 |

## 近期同步记录

- 知识卡版本历史和版本对比交互已收口：当前版本不展示历史对比/回退入口，单版本、同版本、无效版本和回退到当前版本均不可操作；本次仅涉及前端交互边界和单元测试，不变更后端接口、Docker 或环境变量。

## 待维护规则

- 新增 `src/api/*` 接口时，更新 `docs/development-guide.md` 的 API 规则或 `tests/api-contract/` 说明。
- 新增路由或菜单时，更新 `docs/development-guide.md` 的路由权限说明。
- 修改环境变量时，更新 `docs/frontend-development.md` 和 `README.md`。
- 修改 Dockerfile、Compose、Nginx 或 Docker 脚本时，更新 `README.Docker.md`。
- 修改需求文档或素材时，更新 README 文档索引和本看板状态。
