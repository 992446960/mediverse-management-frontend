#!/usr/bin/env bash
# 一键预构建前端 Docker 镜像（多阶段：Node 构建 + Nginx 运行）
# 用法：
#   ./scripts/docker-pre.sh
#!/usr/bin/env bash
set -euo pipefail
docker compose up --build
echo "预构建完成"
echo "请使用 docker compose down 停止容器"
echo "请使用 docker compose up 启动容器"
echo "请使用 docker compose down 停止容器"