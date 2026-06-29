#!/usr/bin/env bash
# 一键构建前端 Docker 镜像（多阶段：Node 构建 + Nginx 运行）
# 用法：
#   ./scripts/docker-build.sh
#   ./scripts/docker-build.sh <remote-host>
set -euo pipefail

IMAGE_TAG="mediverse-management-frontend:latest"
TAR_PATH="./docker-dist/mediverse-frontend-$(date +%Y%m%d).tar"
REMOTE_USER="root"
REMOTE_HOST="${1:-}"
REMOTE_DIR="/root/docker-dist" # 服务器上存放 tar 的目录，需已存在或先 mkdir

mkdir -p "$(dirname "$TAR_PATH")"
docker compose build
docker save "$IMAGE_TAG" -o "$TAR_PATH"
echo "saved: $TAR_PATH"

if [[ -n "$REMOTE_HOST" ]]; then
  scp "$TAR_PATH" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"
  echo "uploaded to ${REMOTE_HOST}:${REMOTE_DIR}/"
else
  echo "upload skipped: remote host not provided"
fi
