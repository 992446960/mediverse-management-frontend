#!/usr/bin/env bash
# 一键构建前端 Docker 镜像（多阶段：Node 构建 + Nginx 运行）
# 用法：
#   拉取代码后请在下方手动将 REMOTE_HOST 改为实际服务器 IP 或域名。
#   ./scripts/docker-build.sh
set -euo pipefail

IMAGE_TAG="mediverse-management-frontend:latest"
TAR_PATH="./docker-dist/mediverse-frontend-$(date +%Y%m%d).tar"
REMOTE_USER="root"
# 占位符：请手动改为实际 SCP 目标主机
REMOTE_HOST="YOUR_REMOTE_HOST"
if [[ "$REMOTE_HOST" == "YOUR_REMOTE_HOST" ]]; then
  echo "错误：请在 scripts/docker-build.sh 中将 REMOTE_HOST（当前为占位 YOUR_REMOTE_HOST）手动改为实际 IP 或域名。" >&2
  exit 1
fi
REMOTE_DIR="/root/docker-images" # 服务器上存放 tar 的目录，需已存在或先 mkdir

docker compose build
docker save "$IMAGE_TAG" -o "$TAR_PATH"
echo "saved: $TAR_PATH"

scp "$TAR_PATH" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"
echo "uploaded to ${REMOTE_HOST}:${REMOTE_DIR}/"
