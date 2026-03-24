# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

## Docker

多阶段构建：Node 执行 `pnpm build`，nginx 托管 `dist` 并反代 `/api/`（`API_UPSTREAM` 与开发环境 `vite` 里 `server.proxy['/api']` 的 target 同义）。镜像构建时默认注入 **`VITE_API_BASE_URL=/api/v1`**，使前端打同源 `/api/v1/...`（例如登录为 `POST /api/v1/auth/login`），避免 `.env.production` 里绝对域名导致绕开本机 nginx。

验证登录（Host 由 nginx 改为 `API_PROXY_HOST`，避免 WAF 因收到 `Host: localhost` 报错）：  
`curl -sS http://localhost:8080/api/v1/auth/login -H 'Content-Type: application/json' -d '{"username":"…","password":"…"}'`。若上游仍拦截，可加上浏览器同类头：`-A 'Mozilla/5.0'`。

**架构说明**：在 **Apple Silicon（M 系列）Mac** 上默认构建出 **`linux/arm64`** 镜像；百度云等常见云主机多为 **`linux/amd64`**。若部署到 x86 服务器，必须指定平台，否则容器内会出现 **`exec format error`**、端口无法访问。

```bash
# 本机预览（Mac 默认架构即可）
docker build -t mediverse-management-frontend:local .

# 交付 / 部署到 x86（amd64）服务器时使用（首次可能多下底层镜像）
docker build --platform linux/amd64 -t mediverse-management-frontend:local .

# 运行（默认 API_UPSTREAM 见 Dockerfile 中 ENV；可按环境覆盖）
docker run --rm -p 8080:80 \
  -e API_UPSTREAM=https://mediverse-management.huaxisy.com \
  mediverse-management-frontend:local
```

或使用 Compose 一键构建并预览：`docker compose up --build`，浏览器打开 `http://localhost:8080`。

**Compose 与架构**：仓库内 `docker-compose.yml` 已为 `frontend` 服务设置 **`platform: linux/amd64`**。在 Apple Silicon 上执行 `docker compose build` 时，会产出可在常见 **x86 云主机** 上运行的镜像；镜像名默认为 **`mediverse-management-frontend-frontend:latest`**（项目目录名 + 服务名）。

### 镜像交付给后端（部署到服务器）

**方式 A：推私有镜像仓库（推荐）**  
在本机构建并打标签后推送，后端 `docker pull` + `docker run` / `compose` 即可。

```bash
# 云服务器多为 amd64，务必加 --platform（或与下方 Compose 方式二选一）
docker build --platform linux/amd64 -t <registry>/<namespace>/mediverse-management-frontend:1.0.0 .

docker push <registry>/<namespace>/mediverse-management-frontend:1.0.0
```

发给对方：**镜像地址 + 版本 tag**，以及下方「运行时环境变量」。

**方式 B：离线 `tar.gz` 包（scp 上传，无仓库时使用）**

以下为「本机构建 → 校验压缩包 → 上传 → 服务器加载 → 替换容器」的完整流程；**不要**只上传文件而不在服务器执行 `docker load`，也**不要**用未校验通过或上传中断的压缩包。

**1. 本机（macOS，项目根目录）**

离线包请输出到仓库内 **`docker-dist/`**（该目录下除 `.gitkeep` 外已被 `.gitignore` 忽略，避免误提交大文件）。

```bash
docker compose build

# 导出（镜像名以 docker images 为准，Compose 默认多为 mediverse-management-frontend-frontend:latest）
docker save mediverse-management-frontend-frontend:latest | gzip -1 > docker-dist/mediverse-management-frontend-frontend-latest.tar.gz

# 上传前必须校验，出现 OK 再 scp
gzip -t docker-dist/mediverse-management-frontend-frontend-latest.tar.gz && echo OK
```

```bash
scp docker-dist/mediverse-management-frontend-frontend-latest.tar.gz root@<服务器IP>:/root/
```

（也可用 `docker build --platform linux/amd64 -t <自定义名>:<tag> .` 再 `docker save <自定义名>:<tag>`，与下述服务器步骤中的镜像名保持一致即可。）

**2. 服务器**

```bash
gunzip -c /root/mediverse-management-frontend-frontend-latest.tar.gz | docker load

# 确认架构为 amd64；若为 arm64，说明本机构建未走 amd64，勿启动
docker image inspect mediverse-management-frontend-frontend:latest --format '{{.Architecture}}'

# 替换旧容器（名称与线上一致）
docker rm -f mediverse-frontend

docker run -d --name mediverse-frontend --restart unless-stopped \
  -p 8080:80 \
  -e API_UPSTREAM=https://<实际后端或网关基址> \
  -e API_PROXY_HOST=<与 API_UPSTREAM 同主机名，无 https://> \
  mediverse-management-frontend-frontend:latest

docker ps
```

未压缩的离线包也可用：`docker save ... -o xxx.tar` → 服务器 `docker load -i xxx.tar`。

**3. 发布后**

浏览器访问站点时建议 **强制刷新**（如 macOS `Cmd+Shift+R`）或使用无痕窗口，避免旧版 JS 缓存。

### 部署常见问题

| 现象 | 处理 |
|------|------|
| `gzip: invalid compressed data` / `unexpected EOF` | 压缩包损坏或上传不完整；本机重新 `docker save \| gzip`，`gzip -t` 通过后再 `scp`，确保传输结束。 |
| `The requested image's platform (linux/arm64) does not match ... (linux/amd64)` | 本机镜像为 arm64。请用 **`docker compose build`**（已含 `platform: linux/amd64`）或 **`docker build --platform linux/amd64`** 重建，本机 `docker image inspect ... --format '{{.Architecture}}'` 为 **amd64** 后再导出。 |
| `docker ps` 为空但刚 run 过 | 多为架构不匹配导致进程立即退出；按上一条重建 amd64 镜像。可用 `docker ps -a` 与 `docker logs mediverse-frontend` 确认。 |
| `Conflict. The container name "/mediverse-frontend" is already in use` | 先 `docker rm -f mediverse-frontend` 再 `docker run`。 |

可同时把仓库里的 **`docker-compose.yml`**（按需改端口与环境变量）交给对方，便于一致编排。

**后端部署时必须配置的环境变量**

| 变量 | 含义 | 示例 |
|------|------|------|
| `API_UPSTREAM` | nginx `proxy_pass` 的完整基址（无尾斜杠时会把 `/api/...` 原样拼到该域名后） | `https://api.example.com` |
| `API_PROXY_HOST` | 回源 HTTP `Host` 与 TLS SNI，须为业务域名，**不能**填容器或内网别名 | `api.example.com` |

可选：`docker build --build-arg VITE_API_BASE_URL=...` 仅在需要**不打同源 `/api/v1`**、而要写死完整 API 前缀时再改（默认 `/api/v1` 与当前 nginx 反代模型一致）。

**说明**：容器内监听 **80**；对外端口由后端 `-p` 或前置负载均衡决定。若全院已有统一网关反代 API，请与后端约定 `API_UPSTREAM` 指向网关可达的地址，并保证 `API_PROXY_HOST` 与 WAF/证书域名一致。
