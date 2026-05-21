#!/bin/sh
set -eu

OUTPUT_DIR="${APP_CONFIG_DIR:-/usr/share/nginx/html}"
mkdir -p "${OUTPUT_DIR}"

cat > "${OUTPUT_DIR}/env.js" <<EOF
window.__APP_CONFIG__ = Object.freeze({
  API_BASE_URL: "${API_BASE_URL:-}",
})
EOF
