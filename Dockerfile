# ---- 阶段 1: 构建 ----
FROM node:20-alpine AS builder

# 启用 pnpm（corepack 内置）
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate

WORKDIR /app

# 先复制依赖描述文件，利用 Docker 层缓存
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# 复制源码并构建
COPY . .

# 与 nginx「同域反代」一致：浏览器请求 /api/v1/*，由运行时 API_UPSTREAM 转发（勿用 .env.production 里写死的绝对 API 域名）
# 其他部署如需打满绝对地址：docker build --build-arg VITE_API_BASE_URL=https://api.example.com/api/v1 .
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN pnpm build

# ---- 阶段 2: 运行 ----
FROM nginx:1.27-alpine

# 删除默认配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制 nginx 配置模板
COPY nginx.conf /etc/nginx/templates/default.conf.template

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 默认后端 API 地址（运行时可通过 -e 覆盖）；API_PROXY_HOST 须与上游站点 Host/SNI 一致
ENV API_UPSTREAM=https://mediverse-management.huaxisy.com
ENV API_PROXY_HOST=mediverse-management.huaxisy.com

EXPOSE 80

# nginx 官方镜像的 entrypoint 会自动用 envsubst 处理 /etc/nginx/templates/ 下的模板
CMD ["nginx", "-g", "daemon off;"]
