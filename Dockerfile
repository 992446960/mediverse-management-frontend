# ============================================================
# 阶段 1：构建（build stage）
# ============================================================
# 使用 Node 22 的 Alpine 版本作为构建环境
# Alpine 是一个极小的 Linux 发行版（~5MB），比 Ubuntu 镜像小很多
# "AS builder" 给这个阶段起名，后面可以引用
FROM node:22-alpine AS builder

# 启用 pnpm（corepack 内置）

RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
# 设置容器内的工作目录（如果不存在会自动创建）
# 之后的 COPY、RUN 等指令都在这个目录下执行
WORKDIR /app


# 先只复制包管理相关文件
# 为什么不直接 COPY . .？因为 Docker 有层缓存机制：
# 如果这些文件没变，下面的 pnpm install 会命中缓存，跳过安装，大幅加快构建速度
# 只有当 package.json 或 lock 文件变了，才会重新安装依赖
COPY package.json pnpm-lock.yaml ./

# 安装依赖
# --frozen-lockfile：严格按照 lock 文件安装，不允许修改 lock 文件
# 这保证了容器内安装的依赖版本和你本地开发完全一致，是 CI/CD 的最佳实践
RUN pnpm install --frozen-lockfile

# 复制项目所有源代码（被 .dockerignore 排除的除外）
COPY . .

ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# 执行构建，生成 dist/ 目录
RUN pnpm build

# ============================================================
# 阶段 2：运行（production stage）
# ============================================================
# 使用 Nginx 的 Alpine 版本作为运行环境
# 最终镜像只包含 Nginx + 你的静态文件，没有 Node.js、没有源代码、没有 node_modules
# 这就是"多阶段构建"的好处：最终镜像非常小（~30MB），且攻击面小
FROM nginx:stable-alpine

# 删除 Nginx 默认的配置文件和欢迎页
RUN rm /etc/nginx/conf.d/default.conf

# 复制 nginx 配置模板（需要注入环境变量）
COPY nginx.conf /etc/nginx/templates/default.conf.template

# 从第一阶段（builder）复制构建产物到 Nginx 的静态文件目录
# --from=builder 表示从 builder 阶段取文件，而不是从本地
COPY --from=builder /app/dist /usr/share/nginx/html

# 默认后台API地址（运行时可通过-e 覆盖）；API_PROXY_HOST 必须与上游Host/SNI一致，否则无法代理
ENV API_UPSTREAM=https://mediverse-management.huaxisy.com
ENV API_PROXY_HOST=mediverse-management.huaxisy.com

# 声明容器对外暴露 80 端口
# 这只是文档性质的声明，实际端口映射在 docker run 时通过 -p 参数指定
EXPOSE 80



# 容器启动时执行的命令
# nginx -g 'daemon off;' 让 Nginx 在前台运行
# 为什么要前台？因为 Docker 容器的生命周期跟随主进程
# 如果 Nginx 以后台守护进程运行，主进程退出，Docker 会认为容器停止了
CMD ["nginx", "-g", "daemon off;"]
