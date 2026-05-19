# 前端开发文档

本文档说明本项目的启动、联调、验证和部署入口。编码规则见 `docs/development-guide.md`。

## 1. 环境要求

- Node.js 版本需满足 Vite 7 和当前依赖要求；Docker 构建阶段使用 `node:22-alpine`。
- 包管理器使用 pnpm，版本以 `package.json` 的 `packageManager` 为准。
- 首次拉取代码后执行：

```bash
pnpm install
```

## 2. 本地开发

启动开发服务：

```bash
pnpm dev
```

Vite 服务配置在 `vite.config.ts`：

| 配置 | 当前值 |
| --- | --- |
| host | `true` |
| port | `3000` |
| proxy path | `/api` |
| 默认代理目标 | `https://mediverse-management.huaxisy.com` |

本地或局域网后端地址写入 `.env.development.local`，不要提交：

```bash
DEV_PROXY_TARGET=http://127.0.0.1:8005
```

## 3. 环境变量

| 变量 | 说明 |
| --- | --- |
| `VITE_API_BASE_URL` | 前端 API 基础路径，开发默认 `/api/v1` |
| `VITE_FILE_BASE_URL` | 上传接口返回相对路径时的文件基础 URL |
| `VITE_APP_TITLE_SUFFIX` | 浏览器标题后缀 |
| `VITE_ENABLE_MOCK` | 是否启用 MSW mock |
| `DEV_PROXY_TARGET` | Vite 开发代理目标，仅开发环境使用 |

`.env.api-test` 包含 API 测试账号和密码，必须保持 Git 忽略。

## 4. Mock 开发

开发环境默认 `VITE_ENABLE_MOCK=false`。需要使用本地 MSW 时，在本地环境文件中设置：

```bash
VITE_ENABLE_MOCK=true
```

MSW 会在应用挂载前启动，避免首屏 `/auth/me` 请求落到真实代理。

新增 mock 时同步维护：

- `src/mocks/handlers.ts`
- `src/mocks/handlers/*`
- `src/mocks/data/*`

## 5. 验证命令

| 命令 | 说明 |
| --- | --- |
| `pnpm check:docs` | 检查文档新鲜度 |
| `pnpm build` | 类型检查并构建 |
| `pnpm verify` | 文档检查 + 构建 |
| `pnpm test:api` | 真实 API 合规性测试 |
| `docker compose config` | 校验 Docker Compose 配置 |

API 合规测试依赖真实 API、账号和网络条件。缺少 `.env.api-test` 时不要伪造测试结果。

## 6. Docker 打包与部署

Docker 权威文档是 `README.Docker.md`。

本地生产镜像预览：

```bash
docker compose up --build
```

停止：

```bash
docker compose down
```

打包并上传：

```bash
mkdir -p docker-dist
pnpm docker:build
```

`scripts/docker-build.sh` 中的 `REMOTE_HOST="YOUR_REMOTE_HOST"` 是占位值。配置真实服务器前，脚本会主动报错，避免上传到错误目标。

## 7. 提交前检查

文档变更：

```bash
pnpm check:docs
```

代码、配置、Docker 或依赖变更：

```bash
pnpm verify
```

Docker 配置变更额外执行：

```bash
docker compose config
```
