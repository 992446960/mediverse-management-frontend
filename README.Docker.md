# mediverse-management-frontend Docker 打包与部署

本文档是本项目 Docker 打包、上传、部署、更新和回滚的唯一权威文档。内容必须与 `Dockerfile`、`compose.yaml`、`nginx.conf`、`scripts/docker-build.sh`、`scripts/docker-pre.sh`、`package.json` 保持一致。

## 1. 构建与运行模型

| 文件 | 职责 |
| --- | --- |
| `Dockerfile` | 多阶段构建：`node:22-alpine` 编译前端，`nginx:stable-alpine` 运行静态产物 |
| `compose.yaml` | 本地构建和预览生产镜像，服务名为 `frontend` |
| `nginx.conf` | Nginx 模板，托管静态资源并反向代理 `/api/` |
| `scripts/docker-pre.sh` | 执行 `docker compose up --build`，用于本地生产镜像预览 |
| `scripts/docker-build.sh` | 构建镜像、导出 tar，可选上传到服务器 |
| `docker-dist/` | 本地导出的镜像 tar 目录，不纳入 Git |

构建阶段使用 `pnpm@10.28.2`，执行 `pnpm install --frozen-lockfile` 和 `pnpm build`。运行阶段只包含 Nginx 和 `dist/` 静态文件。

## 2. 变量说明

| 变量 | 阶段 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | 构建期 | `/api/v1` | 写入前端静态产物，决定浏览器请求 API 的基础路径 |
| `API_UPSTREAM` | 运行期 | `https://mediverse-management.huaxisy.com` | Nginx `/api/` 反向代理的上游完整 URL |
| `API_PROXY_HOST` | 运行期 | `mediverse-management.huaxisy.com` | 传给上游的 `Host` 和 TLS SNI，必须与 `API_UPSTREAM` 的域名一致 |

`VITE_API_BASE_URL` 改变后必须重新构建镜像。`API_UPSTREAM` 和 `API_PROXY_HOST` 可以通过 `docker run -e` 在容器运行时覆盖。

## 3. 本地生产镜像预览

在仓库根目录执行：

```bash
docker compose up --build
```

访问：

```text
http://localhost:8080
```

查看状态：

```bash
docker compose ps
```

停止容器：

```bash
docker compose down
```

也可以使用脚本：

```bash
chmod +x scripts/docker-pre.sh
./scripts/docker-pre.sh
```

## 4. 打包 tar 并可选上传服务器

首次执行前确认脚本可执行：

```bash
chmod +x scripts/docker-build.sh
```

只打包并保存到本地 `docker-dist/`：

```bash
pnpm docker:build
```

打包后上传到服务器：

```bash
pnpm docker:build -- <REMOTE_HOST>
```

不要把真实服务器地址提交到公共仓库。脚本会执行：

1. `docker compose build`
2. `docker save mediverse-management-frontend:latest -o ./docker-dist/mediverse-frontend-YYYYMMDD.tar`
3. 传入 `<REMOTE_HOST>` 时，`scp` 上传到 `root@<REMOTE_HOST>:/root/docker-dist/`

如果不使用脚本，可手动上传：

```bash
scp ./docker-dist/mediverse-frontend-YYYYMMDD.tar root@<host>:/root/docker-dist/
```

## 5. 服务器部署

以下命令在服务器上执行。示例 tar 文件名按实际日期替换。

加载镜像：

```bash
docker load -i /root/docker-dist/mediverse-frontend-YYYYMMDD.tar
docker images | grep mediverse-management-frontend
```

停止并移除旧容器：

```bash
docker stop mediverse-management-frontend || true
docker rm mediverse-management-frontend || true
```

使用默认 API 上游运行：

```bash
docker run -d \
  --name mediverse-management-frontend \
  --restart unless-stopped \
  -p 80:80 \
  mediverse-management-frontend:latest
```

覆盖 API 上游运行：

```bash
docker run -d \
  --name mediverse-management-frontend \
  --restart unless-stopped \
  -p 80:80 \
  -e API_UPSTREAM=https://api.example.com \
  -e API_PROXY_HOST=api.example.com \
  mediverse-management-frontend:latest
```

`API_PROXY_HOST` 必须是 `API_UPSTREAM` 中的主机名，不带协议和路径。

## 6. 部署验证

查看容器状态：

```bash
docker ps --filter name=mediverse-management-frontend
```

查看日志：

```bash
docker logs --tail=100 mediverse-management-frontend
```

验证首页：

```bash
curl -I http://127.0.0.1/
```

验证静态资源和 history fallback：

```bash
curl -I http://127.0.0.1/admin/users
```

验证 API 代理是否进入 Nginx 规则：

```bash
curl -I http://127.0.0.1/api/v1/auth/me
```

该接口未带 Token 时可能返回 401，重点确认请求能到达上游而不是 Nginx 配置错误。

## 7. 更新与回滚

更新流程：

1. 本地重新执行 `pnpm docker:build` 或手动 `docker compose build && docker save`。
2. 上传新 tar 到服务器。
3. 服务器执行 `docker load`。
4. 停止并移除旧容器。
5. 使用新镜像重新 `docker run`。
6. 执行部署验证。

回滚流程：

1. 保留上一版本 tar 或给旧镜像打 tag。
2. 重新 `docker load -i /root/docker-dist/<old-tar>`。
3. 停止并移除当前容器。
4. 用旧镜像重新 `docker run`。
5. 执行部署验证。

## 8. 常见问题

| 现象 | 处理 |
| --- | --- |
| `scripts/docker-build.sh` 未上传 tar | 执行 `pnpm docker:build -- <REMOTE_HOST>`，或手动 `scp` 到服务器 |
| API 代理返回 4xx/5xx | 确认 `API_UPSTREAM` 和 `API_PROXY_HOST` 域名一致 |
| 修改 `VITE_API_BASE_URL` 后未生效 | 该变量是构建期变量，必须重新构建镜像 |
| 上传文件失败 | 检查 `nginx.conf` 中 `client_max_body_size 50m` 和后端上传限制 |
| Apple Silicon 构建较慢 | `compose.yaml` 固定 `platform: linux/amd64`，本机会走模拟构建 |
