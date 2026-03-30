#!/usr/bin/env bash
# 一键构建前端 Docker 镜像（多阶段：Node 构建 + Nginx 运行）
# 用法：
#   在本机设置 REMOTE_HOST（建议在 ~/.zshrc 中 export REMOTE_HOST=服务器IP或域名）
#   ./scripts/docker-build.sh
set -euo pipefail

IMAGE_TAG="mediverse-management-frontend:latest"
TAR_PATH="./docker-dist/mediverse-frontend-$(date +%Y%m%d).tar"
REMOTE_USER="root"
: "${REMOTE_HOST:?未设置 REMOTE_HOST：请在 ~/.zshrc 等配置中执行 export REMOTE_HOST=服务器IP或域名}"
REMOTE_DIR="/root/docker-images" # 服务器上存放 tar 的目录，需已存在或先 mkdir

docker compose build
docker save "$IMAGE_TAG" -o "$TAR_PATH"
echo "saved: $TAR_PATH"

scp "$TAR_PATH" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"
echo "uploaded to ${REMOTE_HOST}:${REMOTE_DIR}/"
