# mediverse-management-frontend — Docker 说明

本文档与仓库内 **`Dockerfile`**、**`compose.yaml`**、**`nginx.conf`**、**`scripts/docker-build.sh`**、**`scripts/docker-pre.sh`**、**`package.json`** 保持一致。

---

## 一、本项目涉及的路径与文件

| 路径                      | 作用                                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `Dockerfile`              | 多阶段构建：Node 22 + pnpm 编译 → `nginx:stable-alpine` 运行；构建阶段 `WORKDIR` 为 `/app`，产物在镜像内 `/usr/share/nginx/html`。 |
| `compose.yaml`            | 服务名 **`frontend`**，镜像 **`mediverse-management-frontend:latest`**，本地映射 **`8080:80`**。                                   |
| `nginx.conf`              | 构建时复制为镜像内 **`/etc/nginx/templates/default.conf.template`**，由官方 Nginx 镜像在启动时根据环境变量生成 `default.conf`。    |
| `.dockerignore`           | 排除 `node_modules`、`dist`、**`docker-dist/`**、**`*.tar`**、**`.env` / `.env.*`** 等，避免进入构建上下文。                       |
| `scripts/docker-pre.sh`   | 执行 `docker compose up --build`（需在本仓库根目录运行）。                                                                         |
| `scripts/docker-build.sh` | `docker compose build` → `docker save` 到 `docker-dist/` → `scp` 到远程目录。                                                      |
| `docker-dist/`            | `docker-build.sh` 输出 tar 的目录（脚本使用相对路径 **`./docker-dist/`**）。                                                       |

**约定：** 所有 `docker compose` 与脚本均在 **`mediverse-management-frontend` 仓库根目录**（与 `Dockerfile`、`compose.yaml` 同级）执行。

---

## 二、环境前提

| 前提              | 说明                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Docker            | `docker` 可用。                                                                                                          |
| Docker Compose V2 | 使用子命令 **`docker compose`**（与脚本、`compose.yaml` 注释一致）。                                                     |
| Bash              | `scripts/*.sh` 为 bash；Windows 可用 Git Bash / WSL。                                                                    |
| 基础镜像拉取      | 构建需拉取 **`node:22-alpine`**、**`nginx:stable-alpine`**（需能访问镜像源或已配置加速）。                               |
| 平台              | **`compose.yaml`** 中 **`platform: linux/amd64`**，与常见云主机 x86_64 一致；Apple Silicon 本机构建会走 QEMU，可能较慢。 |

### 使用 `scripts/docker-build.sh` 时额外需要

| 前提                    | 说明                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| 目录 **`docker-dist/`** | 脚本写入 **`./docker-dist/mediverse-frontend-$(date +%Y%m%d).tar`**；若不存在请先执行：`mkdir -p docker-dist`。 |
| **SSH / SCP**           | 本机能无交互登录远程主机（密钥或 `ssh-agent`），且 **`scp`** 可用。                                             |
| **`REMOTE_HOST`** | 在 **`scripts/docker-build.sh`** 内手动将占位 **`YOUR_REMOTE_HOST`** 改为实际 IP 或域名；未修改时构建完成后、`scp` 前会报错退出。 |
| 远程目录                | **`REMOTE_DIR`** 见脚本内默认值；目录需在服务器上已存在（可先 **`mkdir -p`**）。                                |

---

## 三、Compose 中的本项目变量（权威默认值）

以下内容摘自 **`compose.yaml`** / **`Dockerfile`**，部署时请与之一致或按需覆盖。

| 名称                                | 本项目中的值                               | 说明                                                                                                         |
| ----------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| **服务名**                          | `frontend`                                 | `docker compose` 针对该服务的操作时使用。                                                                    |
| **容器名**                          | `mediverse-management-frontend`            | `container_name`。                                                                                           |
| **镜像名:标签**                     | `mediverse-management-frontend:latest`     | `image` 与 `docker-build.sh` 中 **`IMAGE_TAG`** 一致。                                                       |
| **构建上下文**                      | `.`                                        | 仓库根目录。                                                                                                 |
| **`VITE_API_BASE_URL`（构建参数）** | `/api/v1`                                  | `compose.yaml` → `build.args`；与 Dockerfile 中 **`ARG VITE_API_BASE_URL=/api/v1`** 一致，打进前端静态资源。 |
| **`API_UPSTREAM`（运行时）**        | `https://mediverse-management.huaxisy.com` | Nginx `proxy_pass` 上游完整 URL；Dockerfile **`ENV`** 与 compose **`environment`** 相同。                    |
| **`API_PROXY_HOST`（运行时）**      | `mediverse-management.huaxisy.com`         | 上游 `Host` 头与 TLS SNI，须与 **`API_UPSTREAM`** 的域名一致。                                               |
| **端口映射（本地 Compose）**        | `8080:80`                                  | 浏览器访问 **`http://localhost:8080`**。                                                                     |

**Nginx 配置模板（`nginx.conf`）中与域名相关的固定值：**

- **`server_name`**：`mediverse-management.huaxisy.com`
- 静态根目录（容器内）：`/usr/share/nginx/html`
- 反代路径前缀：`/api/`

---

## 四、启动与构建脚本

### 1. `scripts/docker-pre.sh`

**作用：** 在仓库根目录执行 **`docker compose up --build`**（前台，日志在终端）。

```bash
chmod +x scripts/docker-pre.sh   # 首次
./scripts/docker-pre.sh
```

**成功后：** 打开 **`http://localhost:8080`**（对应 **`compose.yaml`** 的 **`"8080:80"`**）。

**停止容器：**

```bash
docker compose down
```

**再次启动（已有镜像、不强制重建）：**

```bash
docker compose up
```

---

### 2. `scripts/docker-build.sh`

**作用（顺序固定）：**

1. **`docker compose build`** — 构建 **`mediverse-management-frontend:latest`**（与 **`compose.yaml`** 一致）。
2. **`docker save mediverse-management-frontend:latest -o ./docker-dist/mediverse-frontend-YYYYMMDD.tar`**
3. **`scp`** 将上述 tar 传到远程。

**`docker-build.sh` 中的变量：** **`REMOTE_HOST`** 须在脚本内**手动修改**占位符；仍为 **`YOUR_REMOTE_HOST`** 时脚本会**报错退出**。其余可按需改脚本。

| 变量          | 取值说明                                                                 | 含义                                         |
| ------------- | ------------------------------------------------------------------------ | -------------------------------------------- |
| `IMAGE_TAG`   | `mediverse-management-frontend:latest`                                   | `docker save` 的镜像引用。                   |
| `TAR_PATH`    | `./docker-dist/mediverse-frontend-$(date +%Y%m%d).tar`                   | 本地 tar 路径（日期为运行当天 `YYYYMMDD`）。 |
| `REMOTE_USER` | `root`                                                                   | SCP 登录用户。                               |
| `REMOTE_HOST` | 默认 **`YOUR_REMOTE_HOST`**（占位）；请在本脚本中**手动改为**实际 IP 或域名。 | SCP 目标主机。                               |
| `REMOTE_DIR`  | `/root/docker-images`                                                    | 服务器上存放 tar 的目录（需已存在）。        |

**命令：**

```bash
mkdir -p docker-dist
chmod +x scripts/docker-build.sh
./scripts/docker-build.sh
```

或使用 **`package.json`** 中的脚本（同样调用上述 shell）：

```bash
pnpm docker:build
```

**成功时的典型输出：** `saved: ./docker-dist/mediverse-frontend-YYYYMMDD.tar`，以及 `uploaded to <REMOTE_HOST>:/root/docker-images/`（`<REMOTE_HOST>` 为你在脚本中手动配置的值）。

---

### 3. 不通过脚本、直接使用 Compose（仓库根目录）

```bash
docker compose build
docker compose up -d --build
```

访问：**`http://localhost:8080`**。

查看服务状态：

```bash
docker compose ps
```
### 4.手动上传(127.0.0.1改为自己的ip)
```bash
scp ./docker-dist/mediverse-frontend-20260330.tar root@127.0.0.1:/root/docker-images/
```

---

## 五、云端服务器上的操作（与本项目镜像一致）

以下假设 tar 已由 `docker-build.sh` 上传到 **`/root/docker-images/`**，文件名为示例 **`mediverse-frontend-20260330.tar`**（请换成你机器上实际日期文件名）。

### 1. 加载镜像

```bash
docker load -i /root/docker-images/mediverse-frontend-20260330.tar
docker images | grep mediverse-management-frontend
```

### 2. 运行容器（使用本项目默认上游，无需 `-e`）

与 **`Dockerfile`** 中默认 **`ENV`** 一致时：

```bash
docker run -d \
  --name mediverse-management-frontend \
  --restart unless-stopped \
  -p 80:80 \
  mediverse-management-frontend:latest
```

### 3. 运行容器（覆盖上游 API 域名）

当后端**不是**镜像默认的 `https://mediverse-management.huaxisy.com` 时，需同时传入 **`API_UPSTREAM`**（完整 URL，含协议）与 **`API_PROXY_HOST`**（与上游证书/SNI 一致的域名），例如：

```bash
docker run -d \
  --name mediverse-management-frontend \
  --restart unless-stopped \
  -p 8080:80 \
  -e API_UPSTREAM=https://api.example.com \
  -e API_PROXY_HOST=api.example.com \
  mediverse-management-frontend:latest
```

将 `api.example.com` 换成你的真实 API 主机名；**`API_PROXY_HOST`** 必须与 **`API_UPSTREAM`** 中的主机名一致（无协议、无路径）。

### 4. 云侧通用配置

| 项目            | 说明                                                                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 安全组 / 防火墙 | 放行业务端口（例如 **`80`**；若仅 HTTPS 入口则 **`443`**）。                                                                                                     |
| 域名            | 若对外域名与镜像内 **`server_name mediverse-management.huaxisy.com`** 不一致，多数场景仍可访问；若源站或 CDN 校验 `Host`，需改 **`nginx.conf`** 后重新构建镜像。 |
| HTTPS           | 可在宿主机或前置负载均衡做 TLS，后端指向本容器 **`80`**。                                                                                                        |

### 5. 可选：镜像仓库

```bash
docker tag mediverse-management-frontend:latest <你的仓库>/mediverse-management-frontend:<标签>
docker push <你的仓库>/mediverse-management-frontend:<标签>
```

云上 **`docker pull`** 后 **`docker run`** 的容器名、端口、`-e` 与上一节相同。

---

## 六、参考

- [Docker 入门与分享镜像](https://docs.docker.com/go/get-started-sharing/)
- [Docker Node.js 指南](https://docs.docker.com/language/nodejs/)
